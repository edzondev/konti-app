export type HomeStatus = "starting" | "calculated" | "attention_required" | "insufficient_data";

export type HomePrimaryAction =
	| "open_capture"
	| "open_tax_income"
	| "open_tax_status"
	| "review_document"
	| null;

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
	attention: { count: number; nextItem: null };
	taxSummary: HomeTaxSummary | null;
	summary: {
		processedDocuments: number;
		processingDocuments: number;
		potentiallyRelevantAmount: null;
	};
	nextRelevantEvent: null;
	updatedAt: string;
}
