import { z } from "zod";

import { compareMoney, normalizeMoney } from "@/features/tax-income/money";

const CALENDAR_DATE_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const TAX_YEAR_DATE_PATTERN = /^2026-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

export const monthlyFourthPeriodSchema = z.string().regex(/^2026-(?:0[1-9]|1[0-2])$/);

const answerSchema = z.enum(["yes", "no", "unknown"]);

function isCalendarDate(value: string): boolean {
	if (!CALENDAR_DATE_PATTERN.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function todayInLima(now: Date): string {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(now);
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${values.year}-${values.month}-${values.day}`;
}

function isOccurredMonthlyFactDate(value: string, now = new Date()): boolean {
	return isCalendarDate(value) && value >= "2026-01-01" && value <= todayInLima(now);
}

function isTaxYearDate(value: string): boolean {
	return TAX_YEAR_DATE_PATTERN.test(value) && isCalendarDate(value);
}

function isOccurredTaxYearDate(value: string, now = new Date()): boolean {
	return isTaxYearDate(value) && value <= todayInLima(now);
}

function nextCalendarDay(value: string): string | null {
	if (!isCalendarDate(value)) return null;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	parsed.setUTCDate(parsed.getUTCDate() + 1);
	return parsed.toISOString().slice(0, 10);
}

export const monthlyFourthReviewSchema = z
	.object({
		coverage: z.enum(["complete", "partial", "unknown"]),
		activityClassification: z.enum(["ordinary", "special", "unknown"]),
		suspensionAnswer: answerSchema,
		suspensionAuthorizationDate: z.string(),
		restartAnswer: z.enum(["not_required", "required", "unknown"]),
		restartDate: z.string(),
		filingAnswer: answerSchema,
		filingDate: z.string(),
		filingConfirmationNumber: z.string().max(100),
		paymentAnswer: answerSchema,
		paymentAmount: z.string(),
		paymentDate: z.string(),
		paymentConfirmationCode: z.string().max(100),
	})
	.superRefine((value, context) => {
		if (value.suspensionAnswer === "yes") {
			if (!isOccurredTaxYearDate(value.suspensionAuthorizationDate)) {
				context.addIssue({
					code: "custom",
					path: ["suspensionAuthorizationDate"],
					message: "Ingresa la fecha que figura en la autorización.",
				});
			}

			if (value.restartAnswer === "required") {
				const effectiveFrom = nextCalendarDay(value.suspensionAuthorizationDate);
				if (
					!isOccurredTaxYearDate(value.restartDate) ||
					effectiveFrom === null ||
					value.restartDate < effectiveFrom
				) {
					context.addIssue({
						code: "custom",
						path: ["restartDate"],
						message: "La fecha de reinicio debe ser posterior a la autorización.",
					});
				}
			}
		}

		if (value.filingAnswer === "yes" && !isOccurredMonthlyFactDate(value.filingDate)) {
			context.addIssue({
				code: "custom",
				path: ["filingDate"],
				message: "Ingresa la fecha en que presentaste la declaración.",
			});
		}

		if (value.paymentAnswer === "yes") {
			const normalized = normalizeMoney(value.paymentAmount);
			if (normalized === null || compareMoney(normalized, "0.00") !== 1) {
				context.addIssue({
					code: "custom",
					path: ["paymentAmount"],
					message: "Ingresa el monto que pagaste.",
				});
			}
			if (!isOccurredMonthlyFactDate(value.paymentDate)) {
				context.addIssue({
					code: "custom",
					path: ["paymentDate"],
					message: "Ingresa la fecha del pago.",
				});
			}
		}
	});

export type MonthlyFourthReviewValues = z.infer<typeof monthlyFourthReviewSchema>;

export const monthlyFourthReviewDefaults: MonthlyFourthReviewValues = {
	coverage: "unknown",
	activityClassification: "unknown",
	suspensionAnswer: "unknown",
	suspensionAuthorizationDate: "",
	restartAnswer: "unknown",
	restartDate: "",
	filingAnswer: "unknown",
	filingDate: "",
	filingConfirmationNumber: "",
	paymentAnswer: "unknown",
	paymentAmount: "",
	paymentDate: "",
	paymentConfirmationCode: "",
};
