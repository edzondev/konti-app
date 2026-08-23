import type {
	FOURTH_CATEGORY_2026_ASSUMPTIONS,
	FOURTH_CATEGORY_2026_ASSUMPTIONS_V2,
	FOURTH_CATEGORY_2026_EXCLUSIONS,
} from "./tax-engine.constants";

export type LegacyFourthCategory2026Income = {
	id: string;
	receivedAt: string;
	grossAmountPen: string;
	withheldTaxAmountPen: string;
};

export type FourthCategory2026Income = LegacyFourthCategory2026Income & {
	activityType: "fourth_ordinary" | "fourth_special";
};

export type LegacyFourthCategory2026Input = {
	taxYear: 2026;
	jurisdictionCode: "PE";
	currencyCode: "PEN";
	activity: "ordinary_independent_services";
	incomes: readonly LegacyFourthCategory2026Income[];
};

export type FourthCategory2026Input = {
	taxYear: 2026;
	jurisdictionCode: "PE";
	currencyCode: "PEN";
	incomes: readonly FourthCategory2026Income[];
};

export type LegacyFourthCategory2026Output = {
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

export type FourthCategory2026Output = {
	status: "calculated" | "insufficient_data";
	rulesetVersion: "pe-2026.2.0";
	taxYear: 2026;
	grossFourthIncome: string;
	grossOrdinaryFourthIncome: string;
	automaticDeduction20: string;
	netOrdinaryFourthIncome: string;
	grossSpecialFourthIncome: string;
	netFourthIncome: string;
	sevenUitDeduction: string;
	preliminaryTaxableWorkIncome: string;
	calculatedTaxBeforeAdditionalDeductions: string;
	registeredWithholdings: string;
	registeredFourthWithholdings: string;
	differenceAfterRegisteredWithholdings: string;
	includedIncomeCount: number;
	assumptions: typeof FOURTH_CATEGORY_2026_ASSUMPTIONS_V2;
	exclusions: typeof FOURTH_CATEGORY_2026_EXCLUSIONS;
};

export type AnyFourthCategory2026Input = LegacyFourthCategory2026Input | FourthCategory2026Input;

export type AnyFourthCategory2026Output = LegacyFourthCategory2026Output | FourthCategory2026Output;

export type WorkIncomeTax2026Input = {
	taxYear: 2026;
	jurisdictionCode: "PE";
	currencyCode: "PEN";
	fourthIncomes: readonly FourthCategory2026Income[];
	employmentIncomes: readonly import("./pe-2026/fifth-category.rules").EmploymentIncome2026[];
	deductionRecords?: readonly import("../tax-deductions/tax-deduction.types").TaxDeductionRecord[];
	confirmedAdvancePayments?: string;
	knownUnregisteredInformation?: boolean;
};

export type WorkIncomeTax2026Output =
	import("./pe-2026/work-income-consolidator").WorkIncome2026Output & {
		status: "calculated" | "insufficient_data";
		grossFourthIncome: string;
		calculatedTaxBeforeAdditionalDeductions: string;
		registeredWithholdings: string;
		differenceAfterRegisteredWithholdings: string;
		includedIncomeCount: number;
		additionalDeductions: import("../tax-deductions/tax-deduction.types").AdditionalDeductionResult;
	};

export type AnyTaxEvaluationInput = AnyFourthCategory2026Input | WorkIncomeTax2026Input;
export type AnyTaxEvaluationOutput = AnyFourthCategory2026Output | WorkIncomeTax2026Output;
