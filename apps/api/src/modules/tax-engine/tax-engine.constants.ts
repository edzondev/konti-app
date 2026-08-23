export const FOURTH_CATEGORY_2026_RULESET = {
	rulesetVersion: "pe-2026.1.0",
	taxYear: 2026,
	uit: "5500.00",
	automaticDeductionRate: "0.20",
	automaticDeductionLimitUit: "24",
	sevenUitDeduction: "7",
	progressiveBrackets: [
		{ widthUit: "5", rate: "0.08" },
		{ widthUit: "15", rate: "0.14" },
		{ widthUit: "15", rate: "0.17" },
		{ widthUit: "10", rate: "0.20" },
		{ widthUit: null, rate: "0.30" },
	] as const,
} as const;

export const FOURTH_CATEGORY_2026_RULESET_V2 = {
	...FOURTH_CATEGORY_2026_RULESET,
	rulesetVersion: "pe-2026.2.0",
} as const;

export const FOURTH_CATEGORY_2026_ASSUMPTIONS_V2 = [
	"cash_basis",
	"ordinary_and_special_fourth_income",
	"registered_data_only",
	"pen_only",
] as const;

export const FOURTH_CATEGORY_2026_ASSUMPTIONS = [
	"cash_basis",
	"ordinary_independent_services_only",
	"registered_data_only",
	"pen_only",
] as const;

export const FOURTH_CATEGORY_2026_EXCLUSIONS = [
	"additional_deduction_3_uit",
	"monthly_obligations",
	"advance_payments",
	"other_credits",
] as const;
