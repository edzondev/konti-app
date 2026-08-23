import Decimal from "decimal.js";
import {
	formatMoney,
	isCalendarDateInTaxYear,
	MONEY_INPUT_PATTERN,
	parseMoney,
	ZERO_MONEY,
} from "../tax-engine/pe-2026/money";
import type {
	AdditionalDeductionDecision,
	AdditionalDeductionExcludedFactor,
	AdditionalDeductionResult,
	DeductionAttentionReason,
	DeductionRejectionReason,
	DeductionRequirementCode,
	DeductionRequirementStatus,
	EffectiveDeductionDisposition,
	MedicalDeductionBeneficiary,
	TaxDeductionCategory,
	TaxDeductionRecord,
} from "./tax-deduction.types";

const TAX_YEAR = 2026;
const UIT_PEN = new Decimal("5500.00");
const SHARED_ADDITIONAL_DEDUCTION_CAP_UIT = new Decimal(3);
const SHARED_ADDITIONAL_DEDUCTION_CAP_PEN = UIT_PEN.times(SHARED_ADDITIONAL_DEDUCTION_CAP_UIT);

const CATEGORY_RATES = {
	restaurants_hotels: new Decimal("0.15"),
	medical_dental_services: new Decimal("0.30"),
	other_fourth_services: new Decimal("0.30"),
	rent: new Decimal("0.30"),
	household_worker_essalud: new Decimal("1.00"),
} as const satisfies Record<TaxDeductionCategory, Decimal>;

const CATEGORY_REQUIREMENTS = {
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

const CATEGORIES = new Set<TaxDeductionCategory>([
	"restaurants_hotels",
	"medical_dental_services",
	"other_fourth_services",
	"rent",
	"household_worker_essalud",
]);
const VERIFICATION_STATUSES = new Set([
	"unknown",
	"user_confirmed",
	"evidence_attached",
	"system_verified",
]);
const CALCULATION_STATUSES = new Set(["excluded", "potential", "included"]);
const REQUIREMENT_STATUSES = new Set<DeductionRequirementStatus>([
	"met",
	"unknown",
	"not_met",
	"not_applicable",
]);
const MEDICAL_BENEFICIARIES = new Set<MedicalDeductionBeneficiary>([
	"self",
	"spouse",
	"accredited_partner",
	"minor_child",
	"adult_child_with_registered_disability",
	"adult_child_without_registered_disability",
	"other",
	"unknown",
]);
const ALLOWED_MEDICAL_BENEFICIARIES = new Set<MedicalDeductionBeneficiary>([
	"self",
	"spouse",
	"accredited_partner",
	"minor_child",
	"adult_child_with_registered_disability",
]);

type EvaluatedRecord = {
	decision: AdditionalDeductionDecision;
	includedAmount: Decimal;
	potentialAmount: Decimal;
	excludedFactors: readonly AdditionalDeductionExcludedFactor[];
};

export class AdditionalDeductionRulesInputError extends Error {
	readonly code = "TAX_ENGINE_INPUT_INVALID" as const;

	constructor() {
		super("Additional-deduction input is invalid.");
		this.name = "AdditionalDeductionRulesInputError";
	}
}

function inputError(): never {
	throw new AdditionalDeductionRulesInputError();
}

function assertBaseRecord(record: TaxDeductionRecord): Decimal {
	if (
		typeof record !== "object" ||
		record === null ||
		typeof record.id !== "string" ||
		record.id.trim().length === 0 ||
		!CATEGORIES.has(record.category) ||
		!isCalendarDateInTaxYear(record.paidAt, TAX_YEAR) ||
		!MONEY_INPUT_PATTERN.test(record.grossAmountPen) ||
		!VERIFICATION_STATUSES.has(record.verificationStatus) ||
		!CALCULATION_STATUSES.has(record.calculationStatus) ||
		!Array.isArray(record.requirements)
	) {
		return inputError();
	}

	const gross = parseMoney(record.grossAmountPen);
	if (!gross.greaterThan(0)) return inputError();
	return gross;
}

function evaluateRequirements(record: TaxDeductionRecord): {
	attentionReasons: DeductionAttentionReason[];
	rejectionReasons: DeductionRejectionReason[];
} {
	const expected = new Set<DeductionRequirementCode>(CATEGORY_REQUIREMENTS[record.category]);
	const seen = new Set<DeductionRequirementCode>();
	const attentionReasons: DeductionAttentionReason[] = [];
	const rejectionReasons: DeductionRejectionReason[] = [];

	for (const requirement of record.requirements) {
		if (
			typeof requirement !== "object" ||
			requirement === null ||
			!expected.has(requirement.code) ||
			seen.has(requirement.code) ||
			!REQUIREMENT_STATUSES.has(requirement.status)
		) {
			return inputError();
		}
		seen.add(requirement.code);
		if (
			requirement.status === "not_applicable" &&
			requirement.code !== "banking_evidence_when_required"
		) {
			return inputError();
		}
		if (requirement.status === "unknown") {
			attentionReasons.push(`requirement_unknown:${requirement.code}`);
		} else if (requirement.status === "not_met") {
			rejectionReasons.push(`requirement_not_met:${requirement.code}`);
		}
	}

	if (seen.size !== expected.size) return inputError();
	return { attentionReasons, rejectionReasons };
}

function medicalBase(
	record: Extract<TaxDeductionRecord, { category: "medical_dental_services" }>,
	gross: Decimal,
	attentionReasons: DeductionAttentionReason[],
	rejectionReasons: DeductionRejectionReason[],
): Decimal | null {
	if (!MEDICAL_BENEFICIARIES.has(record.beneficiary)) return inputError();

	if (record.beneficiary === "unknown") {
		attentionReasons.push("medical_beneficiary_unknown");
	} else if (!ALLOWED_MEDICAL_BENEFICIARIES.has(record.beneficiary)) {
		rejectionReasons.push("medical_beneficiary_not_allowed");
	}

	if (record.insuranceReimbursementAmountPen === null) {
		attentionReasons.push("medical_reimbursement_unknown");
		return null;
	}
	if (!MONEY_INPUT_PATTERN.test(record.insuranceReimbursementAmountPen)) return inputError();

	const reimbursement = parseMoney(record.insuranceReimbursementAmountPen);
	if (reimbursement.greaterThan(gross)) return inputError();
	const base = gross.minus(reimbursement);
	if (base.isZero()) rejectionReasons.push("medical_fully_reimbursed");
	return base;
}

function calculateDisposition(
	record: TaxDeductionRecord,
	attentionReasons: DeductionAttentionReason[],
	rejectionReasons: DeductionRejectionReason[],
): EffectiveDeductionDisposition {
	if (record.calculationStatus === "excluded") {
		rejectionReasons.unshift("excluded_by_canonical_status");
	}
	if (rejectionReasons.length > 0) return "excluded";

	if (record.verificationStatus === "unknown") {
		attentionReasons.push("verification_required");
	}
	if (record.calculationStatus === "potential" && attentionReasons.length === 0) {
		attentionReasons.push("canonical_review_required");
	}
	return attentionReasons.length > 0 ? "potential" : "included";
}

function freezeDecision(
	decision: Omit<AdditionalDeductionDecision, "attentionReasons" | "rejectionReasons"> & {
		attentionReasons: DeductionAttentionReason[];
		rejectionReasons: DeductionRejectionReason[];
	},
): AdditionalDeductionDecision {
	return Object.freeze({
		...decision,
		attentionReasons: Object.freeze([...decision.attentionReasons]),
		rejectionReasons: Object.freeze([...decision.rejectionReasons]),
	});
}

function evaluateRecord(record: TaxDeductionRecord): EvaluatedRecord {
	const gross = assertBaseRecord(record);
	const { attentionReasons, rejectionReasons } = evaluateRequirements(record);
	const excludedFactors: AdditionalDeductionExcludedFactor[] = [];
	let qualifyingBase: Decimal | null = gross;

	if (record.category === "medical_dental_services") {
		qualifyingBase = medicalBase(record, gross, attentionReasons, rejectionReasons);
	} else if (record.category === "other_fourth_services") {
		if (record.fourthActivityType === "unknown") {
			attentionReasons.push("fourth_service_activity_unknown");
		} else if (record.fourthActivityType === "special") {
			rejectionReasons.push("fourth_special_service_not_deductible");
		} else if (record.fourthActivityType !== "ordinary") {
			return inputError();
		}
	} else if (record.category === "rent") {
		if (record.attribution === "unknown") {
			attentionReasons.push("rent_attribution_unknown");
			excludedFactors.push("rent_attribution");
		} else if (record.attribution === "spouse_or_partner") {
			attentionReasons.push("rent_attribution_requires_official_confirmation");
			excludedFactors.push("rent_attribution");
		} else if (record.attribution !== "taxpayer") {
			return inputError();
		}
	}

	const disposition = calculateDisposition(record, attentionReasons, rejectionReasons);
	const rate = CATEGORY_RATES[record.category];
	const amountBasis = qualifyingBase ?? gross;
	const calculatedAmount = amountBasis.times(rate);
	const includedAmount = disposition === "included" ? calculatedAmount : ZERO_MONEY;
	const potentialAmount = disposition === "potential" ? calculatedAmount : ZERO_MONEY;

	return {
		decision: freezeDecision({
			recordId: record.id,
			category: record.category,
			verificationStatus: record.verificationStatus,
			calculationStatus: record.calculationStatus,
			disposition,
			qualifyingBasePen: qualifyingBase === null ? null : formatMoney(qualifyingBase),
			includedDeductionBeforeCapPen: formatMoney(includedAmount),
			potentialDeductionBeforeCapPen: formatMoney(potentialAmount),
			attentionReasons,
			rejectionReasons,
		}),
		includedAmount,
		potentialAmount,
		excludedFactors,
	};
}

function emptyCategoryTotals(): Record<TaxDeductionCategory, Decimal> {
	return {
		restaurants_hotels: ZERO_MONEY,
		medical_dental_services: ZERO_MONEY,
		other_fourth_services: ZERO_MONEY,
		rent: ZERO_MONEY,
		household_worker_essalud: ZERO_MONEY,
	};
}

export class AdditionalDeductionRules {
	calculate(records: readonly TaxDeductionRecord[]): AdditionalDeductionResult {
		if (!Array.isArray(records as unknown)) return inputError();

		const ids = new Set<string>();
		const categoryTotals = emptyCategoryTotals();
		const decisions: AdditionalDeductionDecision[] = [];
		const excludedFactors = new Set<AdditionalDeductionExcludedFactor>();
		let totalBeforeCap = ZERO_MONEY;
		let potentialAmountBeforeCap = ZERO_MONEY;

		for (const record of records) {
			const evaluated = evaluateRecord(record);
			if (ids.has(evaluated.decision.recordId)) return inputError();
			ids.add(evaluated.decision.recordId);
			decisions.push(evaluated.decision);
			categoryTotals[record.category] = categoryTotals[record.category].plus(
				evaluated.includedAmount,
			);
			totalBeforeCap = totalBeforeCap.plus(evaluated.includedAmount);
			potentialAmountBeforeCap = potentialAmountBeforeCap.plus(evaluated.potentialAmount);
			for (const factor of evaluated.excludedFactors) excludedFactors.add(factor);
		}

		const includedAdditionalDeduction = Decimal.min(
			totalBeforeCap,
			SHARED_ADDITIONAL_DEDUCTION_CAP_PEN,
		);
		const frozenDecisions = Object.freeze([...decisions]);
		const frozenExcludedFactors = Object.freeze([...excludedFactors]);

		return Object.freeze({
			restaurantsHotelsDeduction: formatMoney(categoryTotals.restaurants_hotels),
			medicalDentalDeduction: formatMoney(categoryTotals.medical_dental_services),
			otherFourthServicesDeduction: formatMoney(categoryTotals.other_fourth_services),
			rentDeduction: formatMoney(categoryTotals.rent),
			householdWorkerEssaludDeduction: formatMoney(categoryTotals.household_worker_essalud),
			totalBeforeCap: formatMoney(totalBeforeCap),
			includedAdditionalDeduction: formatMoney(includedAdditionalDeduction),
			amountDiscardedByCap: formatMoney(totalBeforeCap.minus(includedAdditionalDeduction)),
			potentialAmountBeforeCap: formatMoney(potentialAmountBeforeCap),
			capPen: formatMoney(SHARED_ADDITIONAL_DEDUCTION_CAP_PEN),
			decisions: frozenDecisions,
			excludedFactors: frozenExcludedFactors,
		});
	}
}
