export type HomeStatus = "starting" | "calculated" | "attention_required" | "insufficient_data";

export type LegacyHomePrimaryAction =
	| "open_capture"
	| "open_tax_income"
	| "open_tax_status"
	| "review_document"
	| null;

export type HomeAttentionAction =
	| {
			kind: "open_tax_income";
			incomeMode: "independent" | "employment" | "mixed";
	  }
	| { kind: "review_rhe_payment"; documentId?: string }
	| { kind: "classify_fourth_activity"; documentId?: string }
	| { kind: "resolve_employment_coverage"; recordId?: string }
	| { kind: "verify_deduction"; deductionId?: string }
	| { kind: "review_monthly_fourth"; period: string }
	| { kind: "open_annual_review" };

export type HomePrimaryAction = LegacyHomePrimaryAction | HomeAttentionAction;

export type HomeAttentionItemType =
	| "confirm_rhe_payment"
	| "classify_fourth_activity"
	| "resolve_employment_coverage"
	| "verify_deduction"
	| "review_monthly_fourth";

export type HomeAttentionItem = Readonly<{
	id: string;
	itemType: HomeAttentionItemType;
	title: string;
	description: string;
	action: HomeAttentionAction;
}>;

export type HomeCoverageLevel = "complete" | "partial" | "unknown";
export type HomeMonthlyCoverage = "complete" | "partial" | "unknown" | "not_applicable";
export type HomeExcludedFactor =
	| "foreign_source_income"
	| "prior_year_credit_balance"
	| "rent_attribution"
	| "other_annual_credit"
	| "annual_filing_obligation_not_determined"
	| "known_unregistered_information";

export type HomeCoverage = Readonly<{
	incomeCoverage: HomeCoverageLevel;
	deductionCoverage: HomeCoverageLevel;
	monthlyCoverage: HomeMonthlyCoverage;
	excludedFactors: readonly HomeExcludedFactor[];
}>;

export type HomeDeductionVerificationStatus =
	| "user_confirmed"
	| "evidence_attached"
	| "system_verified";

export type HomeDeductionSummary = Readonly<{
	includedAmount: string;
	potentialAmount: string;
	unknownCount: number;
	includedVerificationStatuses: readonly HomeDeductionVerificationStatus[];
}>;

export type HomeWorkIncomeSummary = Readonly<{
	fourthGrossAmount: string | null;
	employmentGrossAmount: string | null;
}>;

export interface HomePrimary {
	code:
		| "ADD_FIRST_DOCUMENT"
		| "NOTHING_TO_REVIEW"
		| "ADD_FIRST_INCOME"
		| "VIEW_TAX_STATUS"
		| "REVIEW_FOURTH_INCOME";
	title: string;
	description: string;
	action: HomePrimaryAction;
}

export interface HomeTaxSummary {
	evaluationId: string;
	calculatedAt: string;
	grossFourthIncome: string;
	calculatedTaxBeforeAdditionalDeductions: string;
	registeredWithholdings: string;
	differenceAfterRegisteredWithholdings: string;
	includedIncomeCount: number;
}

export interface HomeResponse {
	status: HomeStatus;
	taxYear: number;
	primary: HomePrimary;
	attention: { count: number; nextItem: HomeAttentionItem | null };
	taxSummary: HomeTaxSummary | null;
	/** New 4.7 read-model fields. Optional while the legacy Home adapter remains available. */
	workIncome?: HomeWorkIncomeSummary | null;
	deductions?: HomeDeductionSummary | null;
	coverage?: HomeCoverage | null;
	monthlyOutstandingCount?: number;
	summary: {
		processedDocuments: number;
		processingDocuments: number;
		potentiallyRelevantAmount: null;
	};
	nextRelevantEvent: null;
	updatedAt: string;
}
