import type { TaxIncomeFilter, TaxIncomePage } from "./types";

export function initialTaxIncomeFilter(value: string | string[] | undefined): TaxIncomeFilter {
	return value === "employment" || value === "fourth" ? value : "all";
}

export function taxIncomeSummaryForFilter(
	summary: TaxIncomePage["summary"],
	filter: TaxIncomeFilter,
) {
	if (filter === "employment") {
		return {
			grossAmount: summary.employmentGrossAmount ?? "0.00",
			withheldTaxAmount: summary.withheldFifth ?? "0.00",
			count: summary.employmentCount ?? 0,
		};
	}
	if (filter === "fourth") {
		return {
			grossAmount: summary.fourthGrossAmount ?? "0.00",
			withheldTaxAmount: summary.withheldFourth ?? "0.00",
			count: summary.fourthCount ?? 0,
		};
	}
	return {
		grossAmount: summary.grossAmount,
		withheldTaxAmount: summary.withheldTaxAmount,
		count: summary.count,
	};
}
