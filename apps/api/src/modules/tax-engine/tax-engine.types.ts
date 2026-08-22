import type {
	FOURTH_CATEGORY_2026_ASSUMPTIONS,
	FOURTH_CATEGORY_2026_EXCLUSIONS,
} from "./tax-engine.constants";

export type FourthCategory2026Income = {
	id: string;
	receivedAt: string;
	grossAmountPen: string;
	withheldTaxAmountPen: string;
};

export type FourthCategory2026Input = {
	taxYear: 2026;
	jurisdictionCode: "PE";
	currencyCode: "PEN";
	activity: "ordinary_independent_services";
	incomes: readonly FourthCategory2026Income[];
};

export type FourthCategory2026Output = {
	status: "calculated" | "insufficient_data";
	rulesetVersion: "pe-2026.1.0";
	taxYear: 2026;
	grossFourthIncome: string;
	automaticDeduction20: string;
	netFourthIncome: string;
	sevenUitDeduction: string;
	preliminaryTaxableWorkIncome: string;
	calculatedTaxBeforeAdditionalDeductions: string;
	registeredWithholdings: string;
	differenceAfterRegisteredWithholdings: string;
	includedIncomeCount: number;
	assumptions: typeof FOURTH_CATEGORY_2026_ASSUMPTIONS;
	exclusions: typeof FOURTH_CATEGORY_2026_EXCLUSIONS;
};
