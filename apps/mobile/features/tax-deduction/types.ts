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
export type DeductionVerificationBasis = "unresolved" | "user_confirmation" | "evidence_attached";
export type DeductionQuestionState = "yes" | "no" | "unknown" | "not_applicable";
export type DeductionRequirementStatus = "met" | "not_met" | "unknown" | "not_applicable";

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

export type TaxDeductionRequirement = Readonly<{
	code: DeductionRequirementCode;
	status: DeductionRequirementStatus;
}>;

export type TaxDeductionRecord = Readonly<{
	id: string;
	category: TaxDeductionCategory;
	paidAt: string;
	grossAmountPen: string;
	verificationStatus: DeductionVerificationStatus;
	calculationStatus: DeductionCalculationStatus;
	sourceDocumentId: string | null;
	requirements: readonly TaxDeductionRequirement[];
	medical: Readonly<{
		beneficiary: MedicalDeductionBeneficiary;
		insuranceReimbursementAmountPen: string | null;
	}> | null;
	fourthActivityType: FourthServiceActivityType | null;
	rentAttribution: RentAttribution | null;
	createdAt: string;
	updatedAt: string;
}>;

export type TaxDeductionSummary = Readonly<{
	includedDeductionPen: string;
	potentialDeductionPen: string;
	capPen: string;
	amountDiscardedByCapPen: string;
	byCategory: Readonly<Record<TaxDeductionCategory, string>>;
}>;

export type TaxDeductionCollection = Readonly<{
	taxYear: number;
	identityMasked: string | null;
	summary: TaxDeductionSummary;
	records: readonly TaxDeductionRecord[];
}>;

export type SaveTaxDeductionBody = Readonly<{
	category: TaxDeductionCategory;
	paidAt: string;
	grossAmountPen: string;
	verificationBasis: DeductionVerificationBasis;
	sourceDocumentId: string | null;
	idempotencyKey: string;
	requestedCalculationStatus: DeductionCalculationStatus;
	requirements: readonly TaxDeductionRequirement[];
	medical: Readonly<{
		beneficiary: MedicalDeductionBeneficiary;
		insuranceReimbursementAmountPen: string | null;
	}> | null;
	fourthActivityType: FourthServiceActivityType | null;
	rentAttribution: RentAttribution | null;
}>;

export type SaveTaxDeductionInput = Readonly<{
	mode: "create" | "update";
	deductionId?: string;
	identity: Readonly<{ dni: string }> | null;
	deduction: SaveTaxDeductionBody;
}>;

export type DeductionQuestionId =
	| "acceptedDocument"
	| "consumerIdentity"
	| "paymentRecorded"
	| "economicActivityCompatible"
	| "issuerStatus"
	| "issuedIn2026"
	| "bankingEvidenceWhenRequired"
	| "fourthCategoryReceipt"
	| "professionRegistered"
	| "beneficiaryIdentity"
	| "issuerEligible"
	| "medicalBeneficiary"
	| "insuranceReimbursementAmountPen"
	| "fourthActivityType"
	| "propertyInPeru"
	| "propertyNotExclusivelyBusinessUse"
	| "rentAttribution"
	| "workerRegistration"
	| "form1676Evidence";

export type DeductionQuestion = Readonly<{
	id: DeductionQuestionId;
	title: string;
	body: string;
	allowsUnknown: boolean;
}>;
