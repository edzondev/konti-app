export type HomeStatus = "starting" | "calculated" | "attention_required" | "insufficient_data";

import type { IncomeMode } from "../../database/schema/schema.types";
import type { HomeAttentionAction, HomeAttentionItem } from "../attention/attention.types";
import type {
	MonthlyTaxCoverageState,
	TaxCoverageState,
	TaxExcludedFactor,
} from "../tax-engine/pe-2026/work-income-consolidator";

export type LegacyHomePrimaryAction =
	| "open_capture"
	| "open_tax_income"
	| "open_tax_status"
	| "review_document"
	| null;

export type OpenTaxIncomeAction = Readonly<{
	kind: "open_tax_income";
	incomeMode: IncomeMode;
}>;

export type HomePrimaryAction = LegacyHomePrimaryAction | HomeAttentionAction | OpenTaxIncomeAction;

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

export type HomeWorkIncomeSummary = Readonly<{
	fourthGrossAmount: string | null;
	employmentGrossAmount: string | null;
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

export type HomeCoverage = Readonly<{
	incomeCoverage: TaxCoverageState;
	deductionCoverage: TaxCoverageState;
	monthlyCoverage: MonthlyTaxCoverageState | "unknown";
	excludedFactors: readonly TaxExcludedFactor[];
}>;
