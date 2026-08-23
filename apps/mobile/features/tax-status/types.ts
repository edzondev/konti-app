export interface FourthCategory2026Output {
	status: "calculated" | "insufficient_data";
	rulesetVersion: "pe-2026.1.0" | "pe-2026.2.0";
	taxYear: 2026;
	grossFourthIncome: string;
	grossOrdinaryFourthIncome?: string;
	automaticDeduction20: string;
	netOrdinaryFourthIncome?: string;
	grossSpecialFourthIncome?: string;
	netFourthIncome: string;
	sevenUitDeduction: string;
	preliminaryTaxableWorkIncome: string;
	calculatedTaxBeforeAdditionalDeductions: string;
	registeredWithholdings: string;
	registeredFourthWithholdings?: string;
	differenceAfterRegisteredWithholdings: string;
	includedIncomeCount: number;
	assumptions: readonly string[];
	exclusions: readonly string[];
}

export interface WorkIncome2026Output {
	status: "calculated" | "insufficient_data";
	rulesetVersion: "pe-2026.2.0";
	taxYear: 2026;
	grossFourthIncome: string;
	grossOrdinaryFourthIncome: string;
	automaticDeduction20: string;
	netOrdinaryFourthIncome: string;
	grossSpecialFourthIncome: string;
	netFourthIncome: string;
	grossFifthIncome: string;
	combinedNetWorkIncome: string;
	sevenUitDeduction: string;
	includedAdditionalDeduction: string;
	appliedAdditionalDeduction: string;
	netTaxableWorkIncome: string;
	calculatedTaxBeforeCredits: string;
	calculatedTaxBeforeAdditionalDeductions: string;
	registeredFourthWithholdings: string;
	registeredFifthWithholdings: string;
	confirmedAdvancePayments: string;
	registeredCredits: string;
	registeredWithholdings: string;
	differenceAfterRegisteredCredits: string;
	differenceAfterRegisteredWithholdings: string;
	includedFourthIncomeCount: number;
	includedFifthIncomeCount: number;
	includedIncomeCount: number;
	employers: readonly { payerTaxId: string | null; payerName: string | null }[];
	employmentCoverageRanges: readonly { start: string; end: string }[];
	missingEmploymentMonths: readonly string[];
	hasMultipleEmployers: boolean;
	coverage: {
		incomeCoverage: "complete" | "partial" | "unknown";
		deductionCoverage: "complete" | "partial" | "unknown";
		monthlyCoverage: "complete" | "partial" | "unknown" | "not_applicable";
		excludedFactors: readonly string[];
	};
	isDefinitive: boolean;
	additionalDeductions: AdditionalDeductionBreakdown;
}

export interface AdditionalDeductionBreakdown {
	restaurantsHotelsDeduction: string;
	medicalDentalDeduction: string;
	otherFourthServicesDeduction: string;
	rentDeduction: string;
	householdWorkerEssaludDeduction: string;
	totalBeforeCap: string;
	includedAdditionalDeduction: string;
	amountDiscardedByCap: string;
	potentialAmountBeforeCap: string;
	capPen: string;
	decisions: readonly AdditionalDeductionDecision[];
	excludedFactors: readonly string[];
}

export interface AdditionalDeductionDecision {
	recordId: string;
	category:
		| "restaurants_hotels"
		| "medical_dental_services"
		| "other_fourth_services"
		| "rent"
		| "household_worker_essalud";
	verificationStatus: "unknown" | "user_confirmed" | "evidence_attached" | "system_verified";
	calculationStatus: "excluded" | "potential" | "included";
	disposition: "excluded" | "potential" | "included";
	qualifyingBasePen: string | null;
	includedDeductionBeforeCapPen: string;
	potentialDeductionBeforeCapPen: string;
	attentionReasons: readonly string[];
	rejectionReasons: readonly string[];
}

export type MonthlyApplicableStatus =
	| "not_reviewed"
	| "insufficient_data"
	| "no_action_detected"
	| "action_likely_required"
	| "awaiting_user_confirmation"
	| "user_recorded_complete";

export interface MonthlyApplicablePeriod {
	period: string;
	status: MonthlyApplicableStatus;
}

export type TaxEvaluationOutput = FourthCategory2026Output | WorkIncome2026Output;

export function isWorkIncomeOutput(output: TaxEvaluationOutput): output is WorkIncome2026Output {
	return "netTaxableWorkIncome" in output && "grossFifthIncome" in output;
}

export interface CurrentTaxStatus {
	status: "calculated" | "attention_required" | "insufficient_data";
	taxYear: 2026;
	evaluation: {
		id: string;
		calculationKind: "fourth_category" | "work_income";
		rulesetVersion: string;
		calculatedAt: string;
		output: TaxEvaluationOutput;
	} | null;
	openAttentionCount: number;
	monthlyPeriods: readonly MonthlyApplicablePeriod[];
}

export interface TaxEvaluation {
	id: string;
	rulesetVersion: string;
	periodStart: string | null;
	periodEnd: string | null;
	triggeredBy: string;
	inputSnapshot: unknown;
	outputSnapshot: TaxEvaluationOutput;
	supersedesId: string | null;
	completedAt: string;
	createdAt: string;
}
