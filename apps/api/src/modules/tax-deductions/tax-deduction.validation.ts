import Decimal from "decimal.js";
import { z } from "zod";
import type { DeductionRequirementCode, TaxDeductionCategory } from "./tax-deduction.types";

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const MAX_AMOUNT = new Decimal("999999999999.99");
const verificationBasis = z.enum(["unresolved", "user_confirmation", "evidence_attached"]);
const requestedCalculationStatus = z.enum(["excluded", "potential", "included"]);
const requirementStatus = z.enum(["met", "unknown", "not_met", "not_applicable"]);

export const requirementsByCategory = {
	restaurants_hotels: [
		"accepted_document",
		"consumer_identity_correct",
		"payment_recorded",
		"compatible_economic_activity",
		"issuer_active_and_habido",
		"issued_in_tax_year",
		"banking_evidence_when_required",
	],
	medical_dental_services: [
		"fourth_category_receipt",
		"profession_registered",
		"beneficiary_identity_correct",
		"payment_recorded",
		"issuer_eligible",
		"banking_evidence_when_required",
	],
	other_fourth_services: [
		"fourth_category_receipt",
		"consumer_identity_correct",
		"payment_recorded",
		"issuer_eligible",
		"banking_evidence_when_required",
	],
	rent: [
		"accepted_rent_document",
		"consumer_identity_correct",
		"payment_recorded",
		"property_in_peru",
		"property_not_exclusively_business_use",
		"issuer_active_and_habido",
		"banking_evidence_when_required",
	],
	household_worker_essalud: ["worker_registration", "form_1676_evidence", "payment_recorded"],
} as const satisfies Record<TaxDeductionCategory, readonly DeductionRequirementCode[]>;

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

function isCalendarDate(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function paidAtSchema(now: Date) {
	const today = todayInLima(now);
	return z
		.string()
		.refine(isCalendarDate)
		.refine((value) => value >= "2026-01-01" && value <= "2026-12-31" && value <= today);
}

function moneySchema(positive: boolean) {
	return z
		.string()
		.regex(MONEY_PATTERN)
		.refine((value) => {
			const amount = new Decimal(value);
			return (
				(positive ? amount.greaterThan(0) : amount.greaterThanOrEqualTo(0)) &&
				amount.lte(MAX_AMOUNT)
			);
		})
		.transform((value) => new Decimal(value).toFixed(2));
}

function categoryRequirements(category: TaxDeductionCategory) {
	const allowed = new Set<DeductionRequirementCode>(requirementsByCategory[category]);
	return z
		.array(z.object({ code: z.string(), status: requirementStatus }).strict())
		.superRefine((requirements, context) => {
			const seen = new Set<string>();
			for (const [index, requirement] of requirements.entries()) {
				if (
					!allowed.has(requirement.code as DeductionRequirementCode) ||
					seen.has(requirement.code)
				) {
					context.addIssue({
						code: "custom",
						path: [index, "code"],
						message: "Requisito inválido.",
					});
				}
				if (
					requirement.status === "not_applicable" &&
					requirement.code !== "banking_evidence_when_required"
				) {
					context.addIssue({
						code: "custom",
						path: [index, "status"],
						message: "No aplica solo está disponible para bancarización cuando corresponde.",
					});
				}
				seen.add(requirement.code);
			}
			if (seen.size !== allowed.size) {
				context.addIssue({ code: "custom", message: "Faltan requisitos de la categoría." });
			}
		})
		.transform(
			(requirements) =>
				requirements as Array<{
					code: DeductionRequirementCode;
					status: z.infer<typeof requirementStatus>;
				}>,
		);
}

const medical = z
	.object({
		beneficiary: z.enum([
			"self",
			"spouse",
			"accredited_partner",
			"minor_child",
			"adult_child_with_registered_disability",
			"adult_child_without_registered_disability",
			"other",
			"unknown",
		]),
		insuranceReimbursementAmountPen: moneySchema(false).nullable(),
	})
	.strict();

function common<Category extends TaxDeductionCategory>(category: Category, now: Date) {
	return {
		category: z.literal(category),
		paidAt: paidAtSchema(now),
		grossAmountPen: moneySchema(true),
		verificationBasis,
		requestedCalculationStatus,
		requirements: categoryRequirements(category),
	};
}

function categorySchemas<Extra extends z.ZodRawShape>(now: Date, extra: Extra) {
	const restaurant = z
		.object({
			...common("restaurants_hotels", now),
			medical: z.null(),
			fourthActivityType: z.null(),
			rentAttribution: z.null(),
			...extra,
		})
		.strict();
	const medicalSchema = z
		.object({
			...common("medical_dental_services", now),
			medical,
			fourthActivityType: z.null(),
			rentAttribution: z.null(),
			...extra,
		})
		.strict()
		.superRefine((value, context) => {
			const candidate = value as {
				medical: { insuranceReimbursementAmountPen: string | null };
				grossAmountPen: string;
			};
			const reimbursement = candidate.medical.insuranceReimbursementAmountPen;
			if (
				reimbursement !== null &&
				new Decimal(reimbursement).greaterThan(candidate.grossAmountPen)
			) {
				context.addIssue({
					code: "custom",
					path: ["medical", "insuranceReimbursementAmountPen"],
					message: "El reembolso no puede superar el gasto.",
				});
			}
		});
	const fourth = z
		.object({
			...common("other_fourth_services", now),
			medical: z.null(),
			fourthActivityType: z.enum(["ordinary", "special", "unknown"]),
			rentAttribution: z.null(),
			...extra,
		})
		.strict();
	const rent = z
		.object({
			...common("rent", now),
			medical: z.null(),
			fourthActivityType: z.null(),
			rentAttribution: z.enum(["taxpayer", "spouse_or_partner", "unknown"]),
			...extra,
		})
		.strict();
	const essalud = z
		.object({
			...common("household_worker_essalud", now),
			medical: z.null(),
			fourthActivityType: z.null(),
			rentAttribution: z.null(),
			...extra,
		})
		.strict();
	return [restaurant, medicalSchema, fourth, rent, essalud] as const;
}

function mutationUnion(now: Date) {
	return z.union(categorySchemas(now, {}));
}

export function createTaxDeductionSchema(now = new Date()) {
	return z.union(
		categorySchemas(now, {
			sourceDocumentId: z.null(),
			idempotencyKey: z.string().uuid(),
			consumerDni: z
				.string()
				.regex(/^\d{8}$/)
				.optional(),
		}),
	) as z.ZodType<CreateTaxDeductionInput>;
}

export function updateTaxDeductionSchema(now = new Date()) {
	return z.union(
		categorySchemas(now, {
			sourceDocumentId: z.string().uuid().nullable(),
			idempotencyKey: z.string().uuid(),
			consumerDni: z
				.string()
				.regex(/^\d{8}$/)
				.optional(),
		}),
	) as z.ZodType<UpdateTaxDeductionInput>;
}

export function documentTaxDeductionDecisionSchema(now = new Date()) {
	return z
		.union(
			categorySchemas(now, {
				documentId: z.string().uuid(),
				decision: z.literal("deduction_confirmed"),
				consumerDni: z
					.string()
					.regex(/^\d{8}$/)
					.optional(),
			}),
		)
		.refine((value) => value.verificationBasis === "evidence_attached", {
			path: ["verificationBasis"],
			message: "La decisión de documento requiere evidencia adjunta.",
		}) as z.ZodType<DocumentTaxDeductionDecisionInput>;
}

export type DeductionMutationData = z.infer<ReturnType<typeof mutationUnion>>;
export type CreateTaxDeductionInput = DeductionMutationData & {
	sourceDocumentId: null;
	idempotencyKey: string;
	consumerDni?: string;
};
export type UpdateTaxDeductionInput = DeductionMutationData & {
	sourceDocumentId: string | null;
	idempotencyKey: string;
	consumerDni?: string;
};
export type DocumentTaxDeductionDecisionInput = DeductionMutationData & {
	documentId: string;
	decision: "deduction_confirmed";
	consumerDni?: string;
};
