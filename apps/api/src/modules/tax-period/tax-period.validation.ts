import Decimal from "decimal.js";
import { z } from "zod";

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const MAX_AMOUNT = new Decimal("999999999999.99");
const TAX_PERIOD_PATTERN = /^2026-(?:0[1-9]|1[0-2])$/;
const TAX_YEAR_DATE_PATTERN = /^2026-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const CALENDAR_DATE_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

export const taxPeriodParamSchema = z.string().regex(TAX_PERIOD_PATTERN);

const publicVerificationScopeSchema = z
	.enum(["user_provided", "evidence_attached"])
	.default("user_provided");

const idempotencySchema = z.string().uuid();

function isCalendarDate(value: string): boolean {
	if (!CALENDAR_DATE_PATTERN.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isTaxYearDate(value: string): boolean {
	return TAX_YEAR_DATE_PATTERN.test(value) && isCalendarDate(value);
}

function nextCalendarDay(value: string): string {
	const parsed = new Date(`${value}T00:00:00.000Z`);
	parsed.setUTCDate(parsed.getUTCDate() + 1);
	return parsed.toISOString().slice(0, 10);
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

function factDateSchema(now: Date) {
	const today = todayInLima(now);
	return z
		.string()
		.refine(isCalendarDate)
		.refine((value) => value >= "2026-01-01" && value <= today);
}

function positiveMoneySchema() {
	return z
		.string()
		.regex(MONEY_PATTERN)
		.refine((value) => new Decimal(value).greaterThan(0) && new Decimal(value).lte(MAX_AMOUNT))
		.transform((value) => new Decimal(value).toFixed(2));
}

function nullableText(max: number) {
	return z
		.union([z.string().max(max), z.null()])
		.optional()
		.transform((value) => value?.trim() || null);
}

const publicFactFields = {
	period: taxPeriodParamSchema,
	idempotencyKey: idempotencySchema,
	verificationScope: publicVerificationScopeSchema,
	sourceDocumentId: z.string().uuid().nullable().optional().default(null),
};

const embeddedPublicFactFields = {
	verificationScope: publicVerificationScopeSchema,
	sourceDocumentId: z.string().uuid().nullable().optional().default(null),
};

function evidenceMatchesScope(value: {
	verificationScope: "user_provided" | "evidence_attached";
	sourceDocumentId: string | null;
}): boolean {
	return value.sourceDocumentId === null
		? value.verificationScope === "user_provided"
		: value.verificationScope === "evidence_attached";
}

export const updateTaxPeriodSchema = z
	.object({
		coverage: z.enum(["complete", "partial", "unknown"]).optional(),
		activityClassification: z.enum(["ordinary", "special", "unknown"]).optional(),
		idempotencyKey: idempotencySchema,
	})
	.strict()
	.refine((value) => value.coverage !== undefined || value.activityClassification !== undefined, {
		message: "Debes registrar cobertura o clasificación de actividad.",
	});

function taxSuspensionSchema<Fields extends z.ZodRawShape>(fields: Fields) {
	return z
		.discriminatedUnion("answer", [
			z
				.object({
					...fields,
					answer: z.literal("yes"),
					authorizationDate: z.string().refine(isTaxYearDate),
					restartState: z.enum(["not_required", "required", "unknown"]),
					restartDate: z.string().nullable(),
				})
				.strict(),
			z
				.object({
					...fields,
					answer: z.literal("no"),
					authorizationDate: z.null(),
					restartState: z.literal("not_required"),
					restartDate: z.null(),
				})
				.strict(),
			z
				.object({
					...fields,
					answer: z.literal("unknown"),
					authorizationDate: z.null(),
					restartState: z.literal("unknown"),
					restartDate: z.null(),
				})
				.strict(),
		])
		.superRefine((value, context) => {
			const candidate = value as {
				answer: "yes" | "no" | "unknown";
				authorizationDate: string | null;
				restartState: "not_required" | "required" | "unknown";
				restartDate: string | null;
				verificationScope: "user_provided" | "evidence_attached";
				sourceDocumentId: string | null;
			};
			if (!evidenceMatchesScope(candidate)) {
				context.addIssue({
					code: "custom",
					path: ["verificationScope"],
					message: "El alcance de verificación no coincide con la evidencia.",
				});
			}
			if (candidate.answer !== "yes" || candidate.authorizationDate === null) return;
			const effectiveFrom = nextCalendarDay(candidate.authorizationDate);
			if (
				(candidate.restartState === "required" &&
					(candidate.restartDate === null ||
						!isTaxYearDate(candidate.restartDate) ||
						candidate.restartDate < effectiveFrom)) ||
				(candidate.restartState !== "required" && candidate.restartDate !== null)
			) {
				context.addIssue({
					code: "custom",
					path: ["restartDate"],
					message: "La fecha de reinicio no es válida.",
				});
			}
		});
}

export const createTaxSuspensionSchema = taxSuspensionSchema(publicFactFields);

function taxFilingSchema<Fields extends z.ZodRawShape>(fields: Fields, now: Date) {
	const yes = z
		.object({
			...fields,
			answer: z.literal("yes"),
			filedAt: factDateSchema(now),
			confirmationNumber: nullableText(100),
		})
		.strict();
	const notYes = (answer: "no" | "unknown") =>
		z
			.object({
				...fields,
				answer: z.literal(answer),
				filedAt: z.null(),
				confirmationNumber: z.null(),
			})
			.strict();
	return z
		.discriminatedUnion("answer", [yes, notYes("no"), notYes("unknown")])
		.refine((value) => evidenceMatchesScope(value as Parameters<typeof evidenceMatchesScope>[0]), {
			path: ["verificationScope"],
			message: "El alcance de verificación no coincide con la evidencia.",
		});
}

export function createTaxFilingSchema(now = new Date()) {
	return taxFilingSchema(publicFactFields, now);
}

function taxPaymentSchema<Fields extends z.ZodRawShape>(fields: Fields, now: Date) {
	const yes = z
		.object({
			...fields,
			answer: z.literal("yes"),
			amountPen: positiveMoneySchema(),
			paidAt: factDateSchema(now),
			confirmationCode: nullableText(100),
		})
		.strict();
	const notYes = (answer: "no" | "unknown") =>
		z
			.object({
				...fields,
				answer: z.literal(answer),
				amountPen: z.null(),
				paidAt: z.null(),
				confirmationCode: z.null(),
			})
			.strict();
	return z
		.discriminatedUnion("answer", [yes, notYes("no"), notYes("unknown")])
		.refine((value) => evidenceMatchesScope(value as Parameters<typeof evidenceMatchesScope>[0]), {
			path: ["verificationScope"],
			message: "El alcance de verificación no coincide con la evidencia.",
		});
}

export function createTaxPaymentSchema(now = new Date()) {
	return taxPaymentSchema(publicFactFields, now);
}

export function createTaxPeriodReviewCommandSchema(now = new Date()) {
	return z
		.object({
			idempotencyKey: idempotencySchema,
			coverage: z.enum(["complete", "partial", "unknown"]),
			activityClassification: z.enum(["ordinary", "special", "unknown"]),
			suspension: taxSuspensionSchema(embeddedPublicFactFields).nullable().optional().default(null),
			filing: taxFilingSchema(embeddedPublicFactFields, now),
			payment: taxPaymentSchema(embeddedPublicFactFields, now),
		})
		.strict();
}

export type UpdateTaxPeriodInput = z.infer<typeof updateTaxPeriodSchema>;
export type CreateTaxSuspensionInput = z.infer<typeof createTaxSuspensionSchema>;
export type CreateTaxFilingInput = z.infer<ReturnType<typeof createTaxFilingSchema>>;
export type CreateTaxPaymentInput = z.infer<ReturnType<typeof createTaxPaymentSchema>>;
export type ReviewTaxPeriodCommandInput = z.infer<
	ReturnType<typeof createTaxPeriodReviewCommandSchema>
>;
