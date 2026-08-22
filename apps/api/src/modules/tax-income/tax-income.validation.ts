import Decimal from "decimal.js";
import { z } from "zod";

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const MAX_NUMERIC_14_2 = new Decimal("999999999999.99");

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
		receivedAt: receivedAtSchema(now),
		grossAmount: moneySchema({ positive: true }),
		withheldTaxAmount: moneySchema({ positive: false }),
		payerName: optionalText(160),
		notes: optionalText(1000),
	};
}

export function createTaxIncomeSchema(now = new Date()) {
	return addWithholdingConstraint(
		z
			.object({
				...editableFields(now),
				idempotencyKey: z.string().uuid(),
			})
			.strict(),
	);
}

export function updateTaxIncomeSchema(now = new Date()) {
	return addWithholdingConstraint(
		z
			.object({
				receivedAt: editableFields(now).receivedAt.optional(),
				grossAmount: editableFields(now).grossAmount.optional(),
				withheldTaxAmount: editableFields(now).withheldTaxAmount.optional(),
				payerName: optionalText(160, true),
				notes: optionalText(1000, true),
			})
			.strict()
			.refine((value) => Object.values(value).some((field) => field !== undefined)),
	);
}

export function createDocumentDecisionSchema(now = new Date()) {
	const notMine = z
		.object({
			documentId: z.string().uuid(),
			decision: z.literal("not_mine"),
		})
		.strict();
	const confirmed = addWithholdingConstraint(
		z
			.object({
				documentId: z.string().uuid(),
				decision: z.literal("confirmed"),
				...editableFields(now),
			})
			.strict(),
	);

	return z.union([notMine, confirmed]);
}

export type CreateTaxIncomeInput = z.output<ReturnType<typeof createTaxIncomeSchema>>;
export type UpdateTaxIncomeInput = z.output<ReturnType<typeof updateTaxIncomeSchema>>;
export type DocumentDecisionInput = z.output<ReturnType<typeof createDocumentDecisionSchema>>;
