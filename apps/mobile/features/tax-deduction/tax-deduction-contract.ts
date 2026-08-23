import { z } from "zod";

import type { TaxDeductionCollection } from "./types";

const category = z.enum([
	"restaurants_hotels",
	"medical_dental_services",
	"other_fourth_services",
	"rent",
	"household_worker_essalud",
]);
const requirementCode = z.enum([
	"accepted_document",
	"consumer_identity_correct",
	"payment_recorded",
	"compatible_economic_activity",
	"issuer_active_and_habido",
	"issued_in_tax_year",
	"banking_evidence_when_required",
	"fourth_category_receipt",
	"profession_registered",
	"beneficiary_identity_correct",
	"issuer_eligible",
	"accepted_rent_document",
	"property_in_peru",
	"property_not_exclusively_business_use",
	"worker_registration",
	"form_1676_evidence",
]);
const money = z.string().regex(/^\d+\.\d{2}$/);
const record = z
	.object({
		id: z.string().min(1),
		category,
		paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		grossAmountPen: money,
		verificationStatus: z.enum([
			"unknown",
			"user_confirmed",
			"evidence_attached",
			"system_verified",
		]),
		calculationStatus: z.enum(["excluded", "potential", "included"]),
		sourceDocumentId: z.string().nullable(),
		requirements: z.array(
			z
				.object({
					code: requirementCode,
					status: z.enum(["met", "not_met", "unknown", "not_applicable"]),
				})
				.strict(),
		),
		medical: z
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
				insuranceReimbursementAmountPen: money.nullable(),
			})
			.strict()
			.nullable(),
		fourthActivityType: z.enum(["ordinary", "special", "unknown"]).nullable(),
		rentAttribution: z.enum(["taxpayer", "spouse_or_partner", "unknown"]).nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.strict();

export const taxDeductionCollectionSchema = z
	.object({
		taxYear: z.literal(2026),
		identityMasked: z
			.string()
			.regex(/^\*{4}\d{4}$/)
			.nullable(),
		summary: z
			.object({
				includedDeductionPen: money,
				potentialDeductionPen: money,
				capPen: money,
				amountDiscardedByCapPen: money,
				byCategory: z.record(category, money),
			})
			.strict(),
		records: z.array(record),
	})
	.strict();

export function parseTaxDeductionCollection(value: unknown): TaxDeductionCollection {
	const result = taxDeductionCollectionSchema.safeParse(value);
	if (!result.success) throw new Error("TAX_DEDUCTION_CONTRACT_INVALID");
	return result.data;
}
