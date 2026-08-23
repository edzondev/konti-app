import { FourthCategoryRules, FourthCategoryRulesInputError } from "./fourth-category.rules";

function income(
	activityType: "fourth_ordinary" | "fourth_special",
	grossAmountPen: string,
	withheldTaxAmountPen = "0.00",
	id = "income-1",
) {
	return {
		id,
		activityType,
		receivedAt: "2026-08-21",
		grossAmountPen,
		withheldTaxAmountPen,
	};
}

describe("FourthCategoryRules", () => {
	const rules = new FourthCategoryRules();

	it("applies the automatic deduction only to ordinary fourth income", () => {
		expect(
			rules.calculate([
				income("fourth_ordinary", "100000.00", "5000.00", "ordinary"),
				income("fourth_special", "10000.00", "800.00", "special"),
			]),
		).toEqual({
			grossOrdinaryFourthIncome: "100000.00",
			automaticDeduction20: "20000.00",
			netOrdinaryFourthIncome: "80000.00",
			grossSpecialFourthIncome: "10000.00",
			netFourthIncome: "90000.00",
			registeredFourthWithholdings: "5800.00",
			includedIncomeCount: 2,
		});
	});

	it("caps the ordinary automatic deduction at twenty-four UIT", () => {
		expect(rules.calculate([income("fourth_ordinary", "700000.00")])).toMatchObject({
			automaticDeduction20: "132000.00",
			netOrdinaryFourthIncome: "568000.00",
			netFourthIncome: "568000.00",
		});
	});

	it("returns stable zero amounts when no income exists", () => {
		expect(rules.calculate([])).toEqual({
			grossOrdinaryFourthIncome: "0.00",
			automaticDeduction20: "0.00",
			netOrdinaryFourthIncome: "0.00",
			grossSpecialFourthIncome: "0.00",
			netFourthIncome: "0.00",
			registeredFourthWithholdings: "0.00",
			includedIncomeCount: 0,
		});
	});

	it("rounds decimal results to cents only at output boundaries", () => {
		expect(rules.calculate([income("fourth_ordinary", "0.01")])).toMatchObject({
			grossOrdinaryFourthIncome: "0.01",
			automaticDeduction20: "0.00",
			netOrdinaryFourthIncome: "0.01",
		});
	});

	it.each([
		["invalid date", { receivedAt: "2025-12-31" }],
		["zero gross", { grossAmountPen: "0.00" }],
		["malformed gross", { grossAmountPen: "one" }],
		["negative withholding", { withheldTaxAmountPen: "-0.01" }],
		["withholding over gross", { grossAmountPen: "100.00", withheldTaxAmountPen: "100.01" }],
	])("rejects %s", (_name, override) => {
		expect(() =>
			rules.calculate([{ ...income("fourth_ordinary", "100.00"), ...override }]),
		).toThrow(FourthCategoryRulesInputError);
	});
});
