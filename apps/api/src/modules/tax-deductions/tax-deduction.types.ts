export type TaxDeductionCategory =
	| "restaurants_hotels"
	| "medical_dental_services"
	| "other_fourth_services"
	| "rent"
	| "household_worker_essalud";

export type DeductionVerificationStatus =
	| "unknown"
	| "user_confirmed"
	| "evidence_attached"
	| "system_verified";

export type DeductionCalculationStatus = "excluded" | "potential" | "included";

export type DeductionRequirementStatus = "met" | "unknown" | "not_met" | "not_applicable";

export type DeductionRequirementCode =
	| "accepted_document"
	| "consumer_identity_correct"
	| "payment_recorded"
	| "compatible_economic_activity"
	| "issuer_active_and_habido"
	| "issued_in_tax_year"
	| "banking_evidence_when_required"
	| "fourth_category_receipt"
	| "profession_registered"
	| "beneficiary_identity_correct"
	| "issuer_eligible"
	| "accepted_rent_document"
	| "property_in_peru"
	| "property_not_exclusively_business_use"
	| "worker_registration"
	| "form_1676_evidence";

export type DeductionRequirement = {
	readonly code: DeductionRequirementCode;
	readonly status: DeductionRequirementStatus;
};

export type MedicalDeductionBeneficiary =
	| "self"
	| "spouse"
	| "accredited_partner"
	| "minor_child"
	| "adult_child_with_registered_disability"
	| "adult_child_without_registered_disability"
	| "other"
	| "unknown";

export type FourthServiceActivityType = "ordinary" | "special" | "unknown";

export type RentAttribution = "taxpayer" | "spouse_or_partner" | "unknown";

type TaxDeductionRecordBase = {
	readonly id: string;
	readonly paidAt: string;
	readonly grossAmountPen: string;
	readonly verificationStatus: DeductionVerificationStatus;
	readonly calculationStatus: DeductionCalculationStatus;
	readonly requirements: readonly DeductionRequirement[];
};

export type RestaurantsHotelsDeductionRecord = TaxDeductionRecordBase & {
	readonly category: "restaurants_hotels";
};

export type MedicalDentalDeductionRecord = TaxDeductionRecordBase & {
	readonly category: "medical_dental_services";
	readonly beneficiary: MedicalDeductionBeneficiary;
	/** `null` means that the reimbursement amount is still unknown. */
	readonly insuranceReimbursementAmountPen: string | null;
};

export type OtherFourthServicesDeductionRecord = TaxDeductionRecordBase & {
	readonly category: "other_fourth_services";
	readonly fourthActivityType: FourthServiceActivityType;
};

export type RentDeductionRecord = TaxDeductionRecordBase & {
	readonly category: "rent";
	readonly attribution: RentAttribution;
};

export type HouseholdWorkerEssaludDeductionRecord = TaxDeductionRecordBase & {
	readonly category: "household_worker_essalud";
};

export type TaxDeductionRecord =
	| RestaurantsHotelsDeductionRecord
	| MedicalDentalDeductionRecord
	| OtherFourthServicesDeductionRecord
	| RentDeductionRecord
	| HouseholdWorkerEssaludDeductionRecord;

export type DeductionAttentionReason =
	| "verification_required"
	| "canonical_review_required"
	| "medical_beneficiary_unknown"
	| "medical_reimbursement_unknown"
	| "fourth_service_activity_unknown"
	| "rent_attribution_unknown"
	| "rent_attribution_requires_official_confirmation"
	| `requirement_unknown:${DeductionRequirementCode}`;

export type DeductionRejectionReason =
	| "excluded_by_canonical_status"
	| "medical_beneficiary_not_allowed"
	| "medical_fully_reimbursed"
	| "fourth_special_service_not_deductible"
	| `requirement_not_met:${DeductionRequirementCode}`;

export type EffectiveDeductionDisposition = "excluded" | "potential" | "included";

export type AdditionalDeductionDecision = {
	readonly recordId: string;
	readonly category: TaxDeductionCategory;
	readonly verificationStatus: DeductionVerificationStatus;
	readonly calculationStatus: DeductionCalculationStatus;
	readonly disposition: EffectiveDeductionDisposition;
	readonly qualifyingBasePen: string | null;
	readonly includedDeductionBeforeCapPen: string;
	readonly potentialDeductionBeforeCapPen: string;
	readonly attentionReasons: readonly DeductionAttentionReason[];
	readonly rejectionReasons: readonly DeductionRejectionReason[];
};

export type AdditionalDeductionExcludedFactor = "rent_attribution";

export type AdditionalDeductionResult = {
	readonly restaurantsHotelsDeduction: string;
	readonly medicalDentalDeduction: string;
	readonly otherFourthServicesDeduction: string;
	readonly rentDeduction: string;
	readonly householdWorkerEssaludDeduction: string;
	readonly totalBeforeCap: string;
	readonly includedAdditionalDeduction: string;
	readonly amountDiscardedByCap: string;
	readonly potentialAmountBeforeCap: string;
	readonly capPen: string;
	readonly decisions: readonly AdditionalDeductionDecision[];
	readonly excludedFactors: readonly AdditionalDeductionExcludedFactor[];
};
