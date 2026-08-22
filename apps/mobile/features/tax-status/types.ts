export interface FourthCategory2026Output {
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
	assumptions: readonly string[];
	exclusions: readonly string[];
}

export interface CurrentTaxStatus {
	status: "calculated" | "attention_required" | "insufficient_data";
	taxYear: 2026;
	evaluation: {
		id: string;
		rulesetVersion: string;
		calculatedAt: string;
		output: FourthCategory2026Output;
	} | null;
	openAttentionCount: number;
}

export interface TaxEvaluation {
	id: string;
	rulesetVersion: string;
	periodStart: string | null;
	periodEnd: string | null;
	triggeredBy: string;
	inputSnapshot: unknown;
	outputSnapshot: FourthCategory2026Output;
	supersedesId: string | null;
	completedAt: string;
	createdAt: string;
}
