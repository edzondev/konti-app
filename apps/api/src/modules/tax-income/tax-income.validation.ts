import Decimal from "decimal.js";
import { z } from "zod";

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const MAX_NUMERIC_14_2 = new Decimal("999999999999.99");
const fourthActivityTypeSchema = z.enum(["fourth_ordinary", "fourth_special"]);
const employmentRecordKindSchema = z.enum(["period", "year_to_date_snapshot"]);
const coverageScopeSchema = z.enum(["single_payer", "all_employers"]);

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

function isCalendarDate(value: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function receivedAtSchema(now: Date) {
	const today = todayInLima(now);
	return z
		.string()
		.refine(isCalendarDate)
		.refine((value) => value >= "2026-01-01" && value <= "2026-12-31")
		.refine((value) => value <= today);
}

function coverageDateSchema(now: Date) {
	const today = todayInLima(now);
	return z
		.string()
		.refine(isCalendarDate)
		.refine((value) => value >= "2026-01-01" && value <= "2026-12-31")
		.refine((value) => value <= today);
}

function moneySchema(options: { positive: boolean }) {
	return z
		.string()
		.regex(MONEY_PATTERN)
		.refine((value) => {
			if (!MONEY_PATTERN.test(value)) return true;
			const amount = new Decimal(value);
			return options.positive ? amount.greaterThan(0) : amount.greaterThanOrEqualTo(0);
		})
		.refine(
			(value) =>
				!MONEY_PATTERN.test(value) || new Decimal(value).lessThanOrEqualTo(MAX_NUMERIC_14_2),
		)
		.transform((value) => new Decimal(value).toFixed(2));
}

function optionalText(maxLength: number, preserveUndefined = false) {
	return z
		.union([z.string().max(maxLength), z.null()])
		.optional()
		.transform((value) => {
			if (value === undefined) return preserveUndefined ? undefined : null;
			if (value == null) return null;
			const normalized = value.trim();
			return normalized.length > 0 ? normalized : null;
		});
}

function addWithholdingConstraint<Schema extends z.ZodType<Record<string, unknown>>>(
	schema: Schema,
) {
	return schema.superRefine((value, context) => {
		if (typeof value.grossAmount !== "string" || typeof value.withheldTaxAmount !== "string") {
			return;
		}
		if (!MONEY_PATTERN.test(value.grossAmount) || !MONEY_PATTERN.test(value.withheldTaxAmount)) {
			return;
		}

		if (new Decimal(value.withheldTaxAmount).greaterThan(value.grossAmount)) {
			context.addIssue({
				code: "custom",
				path: ["withheldTaxAmount"],
				message: "La retención no puede superar el ingreso bruto.",
			});
		}
	});
}

function editableFields(now: Date) {
	return {
		activityType: fourthActivityTypeSchema,
		receivedAt: receivedAtSchema(now),
		grossAmount: moneySchema({ positive: true }),
		withheldTaxAmount: moneySchema({ positive: false }),
		payerName: optionalText(160),
		notes: optionalText(1000),
	};
}

export function createTaxIncomeSchema(now = new Date()) {
	const fourth = addWithholdingConstraint(
		z
			.object({
				...editableFields(now),
				idempotencyKey: z.string().uuid(),
			})
			.strict(),
	);
	const employment = addWithholdingConstraint(
		z
			.object({
				incomeType: z.literal("employment"),
				recordKind: employmentRecordKindSchema,
				coverageStart: coverageDateSchema(now),
				coverageEnd: coverageDateSchema(now),
				coverageScope: coverageScopeSchema,
				grossAmount: moneySchema({ positive: true }),
				withheldTaxAmount: moneySchema({ positive: false }),
				payerName: optionalText(160),
				payerTaxId: z
					.union([z.string().regex(/^\d{11}$/), z.null()])
					.optional()
					.transform((value) => value ?? null),
				notes: optionalText(1000),
				idempotencyKey: z.string().uuid(),
			})
			.strict()
			.superRefine((value, context) => {
				if (value.coverageStart > value.coverageEnd) {
					context.addIssue({
						code: "custom",
						path: ["coverageEnd"],
						message: "El fin de cobertura no puede preceder al inicio.",
					});
				}
				if (value.coverageScope === "single_payer" && !value.payerName && !value.payerTaxId) {
					context.addIssue({
						code: "custom",
						path: ["payerName"],
						message: "Identifica al empleador de este ingreso.",
					});
				}
				if (
					value.coverageScope === "all_employers" &&
					value.recordKind !== "year_to_date_snapshot"
				) {
					context.addIssue({
						code: "custom",
						path: ["coverageScope"],
						message: "La cobertura de todos los empleadores requiere un acumulado confirmado.",
					});
				}
			}),
	);

	return z.union([fourth, employment]);
}

export function updateTaxIncomeSchema(now = new Date()) {
	const fourth = addWithholdingConstraint(
		z
			.object({
				activityType: fourthActivityTypeSchema.optional(),
				receivedAt: editableFields(now).receivedAt.optional(),
				grossAmount: editableFields(now).grossAmount.optional(),
				withheldTaxAmount: editableFields(now).withheldTaxAmount.optional(),
				payerName: optionalText(160, true),
				notes: optionalText(1000, true),
			})
			.strict()
			.refine((value) => Object.values(value).some((field) => field !== undefined)),
	);
	const employment = addWithholdingConstraint(
		z
			.object({
				incomeType: z.literal("employment"),
				recordKind: employmentRecordKindSchema.optional(),
				coverageStart: coverageDateSchema(now).optional(),
				coverageEnd: coverageDateSchema(now).optional(),
				coverageScope: coverageScopeSchema.optional(),
				grossAmount: moneySchema({ positive: true }).optional(),
				withheldTaxAmount: moneySchema({ positive: false }).optional(),
				payerName: optionalText(160, true),
				payerTaxId: z.union([z.string().regex(/^\d{11}$/), z.null()]).optional(),
				notes: optionalText(1000, true),
			})
			.strict()
			.refine((value) => Object.keys(value).some((field) => field !== "incomeType")),
	);

	return z.union([fourth, employment]);
}

export function createDocumentDecisionSchema(now = new Date()) {
	const noIncomeDecision = (decision: "unpaid" | "unsure" | "activity_unsure" | "not_mine") =>
		z
			.object({
				documentId: z.string().uuid(),
				decision: z.literal(decision),
			})
			.strict();
	const paid = addWithholdingConstraint(
		z
			.object({
				documentId: z.string().uuid(),
				decision: z.literal("paid"),
				...editableFields(now),
			})
			.strict(),
	);
	const employmentConfirmed = addWithholdingConstraint(
		z
			.object({
				documentId: z.string().uuid(),
				decision: z.literal("employment_confirmed"),
				incomeType: z.literal("employment"),
				recordKind: employmentRecordKindSchema,
				coverageStart: coverageDateSchema(now),
				coverageEnd: coverageDateSchema(now),
				coverageScope: coverageScopeSchema,
				grossAmount: moneySchema({ positive: true }),
				withheldTaxAmount: moneySchema({ positive: false }),
				payerName: optionalText(160),
				payerTaxId: z
					.union([z.string().regex(/^\d{11}$/), z.null()])
					.optional()
					.transform((value) => value ?? null),
				notes: optionalText(1000),
			})
			.strict()
			.superRefine((value, context) => {
				if (value.coverageStart > value.coverageEnd) {
					context.addIssue({ code: "custom", path: ["coverageEnd"], message: "Rango inválido." });
				}
				if (value.coverageScope === "single_payer" && !value.payerName && !value.payerTaxId) {
					context.addIssue({
						code: "custom",
						path: ["payerName"],
						message: "Empleador requerido.",
					});
				}
				if (
					value.coverageScope === "all_employers" &&
					value.recordKind !== "year_to_date_snapshot"
				) {
					context.addIssue({
						code: "custom",
						path: ["coverageScope"],
						message: "Cobertura inválida.",
					});
				}
			}),
	);

	return z.union([
		paid,
		employmentConfirmed,
		noIncomeDecision("unpaid"),
		noIncomeDecision("unsure"),
		noIncomeDecision("activity_unsure"),
		noIncomeDecision("not_mine"),
	]);
}

export function createEmploymentCoverageResolutionSchema() {
	return z
		.object({
			decision: z.enum(["include_separately", "exclude_as_covered"]),
		})
		.strict();
}

export type CreateTaxIncomeInput = z.output<ReturnType<typeof createTaxIncomeSchema>>;
export type CreateFourthTaxIncomeInput = Extract<CreateTaxIncomeInput, { activityType: string }>;
export type CreateEmploymentTaxIncomeInput = Extract<
	CreateTaxIncomeInput,
	{ incomeType: "employment" }
>;
export type UpdateTaxIncomeInput = z.output<ReturnType<typeof updateTaxIncomeSchema>>;
export type DocumentDecisionInput = z.output<ReturnType<typeof createDocumentDecisionSchema>>;
export type EmploymentCoverageResolutionInput = z.output<
	ReturnType<typeof createEmploymentCoverageResolutionSchema>
>;
