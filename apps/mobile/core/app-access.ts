import type { IncomeMode } from "@/features/tax-profile/types";

export interface TaxFeatureAccessInput {
	incomeMode: IncomeMode;
	trackDeductibles: boolean;
}

export interface TaxFeatureAccess {
	workIncome: boolean;
	monthlyFourth: boolean;
	deductions: boolean;
}

export function taxFeatureAccess({
	incomeMode,
	trackDeductibles,
}: TaxFeatureAccessInput): TaxFeatureAccess {
	return {
		workIncome: true,
		monthlyFourth: incomeMode === "independent" || incomeMode === "mixed",
		deductions: trackDeductibles,
	};
}
