import { describe, expect, it } from "vitest";

import { initialTaxIncomeFilter, taxIncomeSummaryForFilter } from "./tax-income-summary";

const summary = {
	grossAmount: "7000.00",
	withheldTaxAmount: "350.00",
	count: 3,
	fourthGrossAmount: "2000.00",
	employmentGrossAmount: "5000.00",
	withheldFourth: "200.00",
	withheldFifth: "150.00",
	fourthCount: 2,
	employmentCount: 1,
};

describe("taxIncomeSummaryForFilter", () => {
	it.each([
		["all", { grossAmount: "7000.00", withheldTaxAmount: "350.00", count: 3 }],
		["fourth", { grossAmount: "2000.00", withheldTaxAmount: "200.00", count: 2 }],
		["employment", { grossAmount: "5000.00", withheldTaxAmount: "150.00", count: 1 }],
	] as const)("uses the %s breakdown", (filter, expected) => {
		expect(taxIncomeSummaryForFilter(summary, filter)).toEqual(expected);
	});
});

describe("initialTaxIncomeFilter", () => {
	it("accepts only supported route filters", () => {
		expect(initialTaxIncomeFilter("employment")).toBe("employment");
		expect(initialTaxIncomeFilter("fourth")).toBe("fourth");
		expect(initialTaxIncomeFilter("unknown")).toBe("all");
	});
});
