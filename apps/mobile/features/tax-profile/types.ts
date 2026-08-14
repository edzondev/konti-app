export type IncomeMode = "employment" | "independent" | "mixed";

export type TaxProfileStatus = "draft" | "complete" | "needs_review";

export interface TaxProfile {
	id: string;
	taxYear: number;
	incomeMode: IncomeMode | null;
	status: TaxProfileStatus;
	jurisdictionCode: string;
	currencyCode: string;
	timezone: string;
	completedAt: string | null;
}

export interface CurrentTaxProfileResponse {
	taxYear: number;
	requiresOnboarding: boolean;
	profile: TaxProfile | null;
}

export interface UpdateTaxProfileInput {
	incomeMode: IncomeMode;
}
