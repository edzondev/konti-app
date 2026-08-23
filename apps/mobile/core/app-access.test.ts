import { describe, expect, it } from "vitest";

import { taxFeatureAccess } from "./app-access";

describe("taxFeatureAccess", () => {
	it.each([
		["independent", true, true, true],
		["employment", true, false, false],
		["mixed", true, true, true],
	] as const)(
		"allows the correct work-income surfaces for %s",
		(incomeMode, workIncome, monthlyFourth, deductions) => {
			expect(taxFeatureAccess({ incomeMode, trackDeductibles: deductions })).toEqual({
				workIncome,
				monthlyFourth,
				deductions,
			});
		},
	);

	it("does not expose deduction routes when tracking is disabled", () => {
		expect(taxFeatureAccess({ incomeMode: "mixed", trackDeductibles: false }).deductions).toBe(
			false,
		);
	});
});
