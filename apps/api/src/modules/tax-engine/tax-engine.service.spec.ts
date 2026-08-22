import belowSevenUit from "../../../test/fixtures/tax/pe/2026/below-seven-uit.json";
import noIncome from "../../../test/fixtures/tax/pe/2026/no-income.json";
import progressiveBrackets from "../../../test/fixtures/tax/pe/2026/progressive-brackets.json";
import withholdingsExceedTax from "../../../test/fixtures/tax/pe/2026/withholdings-exceed-tax.json";
import { TaxEngineInputError, TaxEngineService } from "./tax-engine.service";
import type { FourthCategory2026Input } from "./tax-engine.types";

const exclusions = [
	"additional_deduction_3_uit",
	"monthly_obligations",
	"advance_payments",
	"other_credits",
] as const;

function input(incomes: FourthCategory2026Input["incomes"]): FourthCategory2026Input {
	return {
		taxYear: 2026,
		jurisdictionCode: "PE",
		currencyCode: "PEN",
		activity: "ordinary_independent_services",
		incomes,
	};
}

function income(grossAmountPen: string, withheldTaxAmountPen = "0.00", id = "income-1") {
	return {
		id,
		receivedAt: "2026-08-21",
		grossAmountPen,
		withheldTaxAmountPen,
	};
}

describe("TaxEngineService", () => {
	const engine = new TaxEngineService();

	it("returns a stable insufficient-data estimate when no income is registered", () => {
		expect(engine.calculateFourthCategory2026(input([]))).toEqual({
			status: "insufficient_data",
			rulesetVersion: "pe-2026.1.0",
			taxYear: 2026,
			grossFourthIncome: "0.00",
			automaticDeduction20: "0.00",
			netFourthIncome: "0.00",
			sevenUitDeduction: "0.00",
			preliminaryTaxableWorkIncome: "0.00",
			calculatedTaxBeforeAdditionalDeductions: "0.00",
			registeredWithholdings: "0.00",
			differenceAfterRegisteredWithholdings: "0.00",
			includedIncomeCount: 0,
			assumptions: [
				"cash_basis",
				"ordinary_independent_services_only",
				"registered_data_only",
				"pen_only",
			],
			exclusions,
		});
	});

	it("applies the 20 percent deduction and seven UIT exactly at the zero-tax boundary", () => {
		const result = engine.calculateFourthCategory2026(input([income("48125.00")]));

		expect(result).toMatchObject({
			status: "calculated",
			grossFourthIncome: "48125.00",
			automaticDeduction20: "9625.00",
			netFourthIncome: "38500.00",
			sevenUitDeduction: "38500.00",
			preliminaryTaxableWorkIncome: "0.00",
			calculatedTaxBeforeAdditionalDeductions: "0.00",
			differenceAfterRegisteredWithholdings: "0.00",
		});
	});

	it("preserves precision across the one-cent boundary", () => {
		const below = engine.calculateFourthCategory2026(input([income("48124.99")]));
		const above = engine.calculateFourthCategory2026(input([income("48125.01")]));

		expect(below.preliminaryTaxableWorkIncome).toBe("0.00");
		expect(above.preliminaryTaxableWorkIncome).toBe("0.01");
	});

	it.each([
		["82500.00", "27500.00", "2200.00"],
		["185625.00", "110000.00", "13750.00"],
		["288750.00", "192500.00", "27775.00"],
		["357500.00", "247500.00", "38775.00"],
		["370000.00", "257500.00", "41775.00"],
	])("applies the progressive scale for gross %s", (grossAmount, taxableIncome, calculatedTax) => {
		const result = engine.calculateFourthCategory2026(input([income(grossAmount)]));

		expect(result.preliminaryTaxableWorkIncome).toBe(taxableIncome);
		expect(result.calculatedTaxBeforeAdditionalDeductions).toBe(calculatedTax);
	});

	it("caps the automatic deduction at twenty-four UIT", () => {
		const result = engine.calculateFourthCategory2026(input([income("700000.00")]));

		expect(result.automaticDeduction20).toBe("132000.00");
		expect(result.netFourthIncome).toBe("568000.00");
		expect(result.calculatedTaxBeforeAdditionalDeductions).toBe("123375.00");
	});

	it("reports a signed neutral difference when registered withholdings exceed the estimate", () => {
		const result = engine.calculateFourthCategory2026(input([income("100000.00", "5000.00")]));

		expect(result.calculatedTaxBeforeAdditionalDeductions).toBe("4160.00");
		expect(result.registeredWithholdings).toBe("5000.00");
		expect(result.differenceAfterRegisteredWithholdings).toBe("-840.00");
	});

	it("sums registered records without extrapolating missing months", () => {
		const result = engine.calculateFourthCategory2026(
			input([income("30000.00", "100.00", "income-1"), income("20000.00", "50.00", "income-2")]),
		);

		expect(result.grossFourthIncome).toBe("50000.00");
		expect(result.registeredWithholdings).toBe("150.00");
		expect(result.includedIncomeCount).toBe(2);
		expect(result.exclusions).toEqual(exclusions);
	});

	it("is deterministic for the same canonical input", () => {
		const canonicalInput = input([income("123456.78", "987.65")]);

		expect(engine.calculateFourthCategory2026(canonicalInput)).toEqual(
			engine.calculateFourthCategory2026(canonicalInput),
		);
	});

	it.each([
		["another year", { taxYear: 2025 }],
		["another jurisdiction", { jurisdictionCode: "US" }],
		["another currency", { currencyCode: "USD" }],
		["another activity", { activity: "company_director" }],
	])("rejects %s", (_caseName, override) => {
		const invalidInput = {
			...input([income("1000.00")]),
			...override,
		} as FourthCategory2026Input;

		expect(() => engine.calculateFourthCategory2026(invalidInput)).toThrow(TaxEngineInputError);
	});

	it.each([
		["a date outside 2026", { receivedAt: "2025-12-31" }],
		["a negative gross amount", { grossAmountPen: "-1.00" }],
		["a malformed gross amount", { grossAmountPen: "one hundred" }],
		["a negative withholding", { withheldTaxAmountPen: "-0.01" }],
		[
			"a withholding greater than gross income",
			{ grossAmountPen: "100.00", withheldTaxAmountPen: "100.01" },
		],
	])("rejects %s", (_caseName, invalidIncome) => {
		const invalidInput = input([{ ...income("100.00"), ...invalidIncome }]);

		try {
			engine.calculateFourthCategory2026(invalidInput);
			throw new Error("Expected the tax engine to reject invalid input");
		} catch (error) {
			expect(error).toBeInstanceOf(TaxEngineInputError);
			expect(error).toMatchObject({ code: "TAX_ENGINE_INPUT_INVALID" });
		}
	});

	it.each([noIncome, belowSevenUit, progressiveBrackets, withholdingsExceedTax])(
		"matches the $name golden fixture",
		(fixture) => {
			expect(engine.calculateFourthCategory2026(fixture.input as FourthCategory2026Input)).toEqual(
				fixture.expected,
			);
			expect(fixture.rulesetVersion).toBe("pe-2026.1.0");
			expect(fixture.sources).toHaveLength(2);
		},
	);
});
