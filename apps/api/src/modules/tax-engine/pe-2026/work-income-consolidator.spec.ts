import type { FifthCategoryResult } from "./fifth-category.rules";
import type { FourthCategoryResult } from "./fourth-category.rules";
import {
	type TaxCoverage,
	type TaxExcludedFactor,
	WorkIncomeConsolidator,
	WorkIncomeConsolidatorInputError,
} from "./work-income-consolidator";

function fourthResult(override: Partial<FourthCategoryResult> = {}): FourthCategoryResult {
	return {
		grossOrdinaryFourthIncome: "37500.00",
		automaticDeduction20: "7500.00",
		netOrdinaryFourthIncome: "30000.00",
		grossSpecialFourthIncome: "0.00",
		netFourthIncome: "30000.00",
		registeredFourthWithholdings: "1000.00",
		includedIncomeCount: 1,
		...override,
	};
}

function fifthResult(override: Partial<FifthCategoryResult> = {}): FifthCategoryResult {
	return {
		grossFifthIncome: "30000.00",
		registeredFifthWithholdings: "1200.00",
		includedIncomeCount: 1,
		unresolvedIncomeCount: 0,
		employers: [{ payerTaxId: "20123456789", payerName: "ACME SAC" }],
		includedCoverageStart: "2026-01-01",
		includedCoverageEnd: "2026-06-30",
		includedCoverageRanges: [{ start: "2026-01-01", end: "2026-06-30" }],
		missingMonths: ["2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"],
		hasMultipleEmployers: false,
		incomeCoverage: "partial",
		...override,
	};
}

function coverage(override: Partial<TaxCoverage> = {}): TaxCoverage {
	return {
		incomeCoverage: "partial",
		deductionCoverage: "unknown",
		monthlyCoverage: "partial",
		excludedFactors: [],
		...override,
	};
}

describe("WorkIncomeConsolidator", () => {
	const consolidator = new WorkIncomeConsolidator();

	it("consolidates mixed income with one shared seven-UIT deduction", () => {
		const output = consolidator.calculate({
			fourth: fourthResult(),
			fifth: fifthResult(),
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage(),
		});

		expect(output).toMatchObject({
			rulesetVersion: "pe-2026.2.0",
			combinedNetWorkIncome: "60000.00",
			sevenUitDeduction: "38500.00",
			netTaxableWorkIncome: "21500.00",
			calculatedTaxBeforeCredits: "1720.00",
			registeredCredits: "2200.00",
			differenceAfterRegisteredCredits: "-480.00",
			isDefinitive: false,
		});
	});

	it("uses ordinary fourth after 20 percent, special fourth gross, and fifth gross", () => {
		const output = consolidator.calculate({
			fourth: fourthResult({
				grossOrdinaryFourthIncome: "100000.00",
				automaticDeduction20: "20000.00",
				netOrdinaryFourthIncome: "80000.00",
				grossSpecialFourthIncome: "10000.00",
				netFourthIncome: "90000.00",
			}),
			fifth: fifthResult({ grossFifthIncome: "10000.00" }),
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage(),
		});

		expect(output).toMatchObject({
			netOrdinaryFourthIncome: "80000.00",
			grossSpecialFourthIncome: "10000.00",
			grossFifthIncome: "10000.00",
			combinedNetWorkIncome: "100000.00",
		});
	});

	it("floors taxable income at zero after shared deductions", () => {
		const output = consolidator.calculate({
			fourth: fourthResult({
				grossOrdinaryFourthIncome: "12500.00",
				automaticDeduction20: "2500.00",
				netOrdinaryFourthIncome: "10000.00",
				netFourthIncome: "10000.00",
				registeredFourthWithholdings: "0.00",
			}),
			fifth: fifthResult({
				grossFifthIncome: "0.00",
				registeredFifthWithholdings: "0.00",
				includedIncomeCount: 0,
			}),
			includedAdditionalDeduction: "16500.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage(),
		});

		expect(output).toMatchObject({
			sevenUitDeduction: "10000.00",
			appliedAdditionalDeduction: "0.00",
			netTaxableWorkIncome: "0.00",
			calculatedTaxBeforeCredits: "0.00",
		});
	});

	it("caps the applied additional deduction at three UIT without discarding the included total", () => {
		const output = consolidator.calculate({
			fourth: fourthResult({
				grossOrdinaryFourthIncome: "0.00",
				automaticDeduction20: "0.00",
				netOrdinaryFourthIncome: "0.00",
				grossSpecialFourthIncome: "0.00",
				netFourthIncome: "0.00",
				registeredFourthWithholdings: "0.00",
				includedIncomeCount: 0,
			}),
			fifth: fifthResult({
				grossFifthIncome: "100000.00",
				registeredFifthWithholdings: "0.00",
			}),
			includedAdditionalDeduction: "20000.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage(),
		});

		expect(output).toMatchObject({
			includedAdditionalDeduction: "20000.00",
			appliedAdditionalDeduction: "16500.00",
			netTaxableWorkIncome: "45000.00",
		});
	});

	it.each([
		["5 UIT", "27500.00", "66000.00", "2200.00"],
		["20 UIT", "110000.00", "148500.00", "13750.00"],
		["35 UIT", "192500.00", "231000.00", "27775.00"],
		["45 UIT", "247500.00", "286000.00", "38775.00"],
		["50 UIT", "275000.00", "313500.00", "47025.00"],
	])(
		"applies the progressive scale at the %s boundary",
		(_label, taxable, grossFifthIncome, expectedTax) => {
			const output = consolidator.calculate({
				fourth: fourthResult({
					grossOrdinaryFourthIncome: "0.00",
					automaticDeduction20: "0.00",
					netOrdinaryFourthIncome: "0.00",
					grossSpecialFourthIncome: "0.00",
					netFourthIncome: "0.00",
					registeredFourthWithholdings: "0.00",
					includedIncomeCount: 0,
				}),
				fifth: fifthResult({
					grossFifthIncome,
					registeredFifthWithholdings: "0.00",
				}),
				includedAdditionalDeduction: "0.00",
				confirmedAdvancePayments: "0.00",
				coverage: coverage(),
			});

			expect(output.netTaxableWorkIncome).toBe(taxable);
			expect(output.calculatedTaxBeforeCredits).toBe(expectedTax);
		},
	);

	it("subtracts registered credits without naming the result debt or refund", () => {
		const output = consolidator.calculate({
			fourth: fourthResult({ registeredFourthWithholdings: "2500.00" }),
			fifth: fifthResult({ registeredFifthWithholdings: "500.00" }),
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "200.00",
			coverage: coverage(),
		});

		expect(output).toMatchObject({
			registeredFourthWithholdings: "2500.00",
			registeredFifthWithholdings: "500.00",
			confirmedAdvancePayments: "200.00",
			registeredCredits: "3200.00",
			differenceAfterRegisteredCredits: "-1480.00",
		});
		expect(Object.keys(output).join(" ")).not.toMatch(/debt|refund|due/i);
	});

	it("preserves every known exclusion and always adds annual filing uncertainty", () => {
		const allFactors: TaxExcludedFactor[] = [
			"foreign_source_income",
			"prior_year_credit_balance",
			"rent_attribution",
			"other_annual_credit",
			"known_unregistered_information",
		];
		const output = consolidator.calculate({
			fourth: fourthResult(),
			fifth: fifthResult(),
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage({
				incomeCoverage: "complete",
				deductionCoverage: "complete",
				monthlyCoverage: "complete",
				excludedFactors: allFactors,
			}),
		});

		expect(output.coverage.excludedFactors).toEqual([
			...allFactors,
			"annual_filing_obligation_not_determined",
		]);
		expect(output.isDefinitive).toBe(false);
	});

	it("remains non-definitive with complete coverage because annual filing is outside the ruleset", () => {
		const output = consolidator.calculate({
			fourth: fourthResult(),
			fifth: fifthResult(),
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage({
				incomeCoverage: "complete",
				deductionCoverage: "complete",
				monthlyCoverage: "complete",
				excludedFactors: [],
			}),
		});

		expect(output.coverage.excludedFactors).toEqual(["annual_filing_obligation_not_determined"]);
		expect(output.isDefinitive).toBe(false);
	});

	it("does not mutate category results or caller-provided coverage", () => {
		const fourth = Object.freeze(fourthResult());
		const fifth = Object.freeze(fifthResult());
		const excludedFactors = Object.freeze([]) as readonly TaxExcludedFactor[];
		const inputCoverage = Object.freeze(
			coverage({
				excludedFactors,
			}),
		);
		const input = Object.freeze({
			fourth,
			fifth,
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "0.00",
			coverage: inputCoverage,
		});

		const output = consolidator.calculate(input);

		expect(excludedFactors).toEqual([]);
		expect(input.coverage.excludedFactors).toBe(excludedFactors);
		expect(output.coverage.excludedFactors).toEqual(["annual_filing_obligation_not_determined"]);
	});

	it("keeps a numeric estimate while exposing partial or unknown coverage", () => {
		const output = consolidator.calculate({
			fourth: fourthResult(),
			fifth: fifthResult(),
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage({
				incomeCoverage: "unknown",
				deductionCoverage: "partial",
				monthlyCoverage: "not_applicable",
			}),
		});

		expect(output.calculatedTaxBeforeCredits).toBe("1720.00");
		expect(output.coverage).toMatchObject({
			incomeCoverage: "unknown",
			deductionCoverage: "partial",
			monthlyCoverage: "not_applicable",
		});
		expect(output.isDefinitive).toBe(false);
	});

	it("keeps a numeric estimate when no elapsed monthly review is known", () => {
		const output = consolidator.calculate({
			fourth: fourthResult(),
			fifth: fifthResult(),
			includedAdditionalDeduction: "0.00",
			confirmedAdvancePayments: "0.00",
			coverage: coverage({ monthlyCoverage: "unknown" as never }),
		});

		expect(output.calculatedTaxBeforeCredits).toBe("1720.00");
		expect(output.coverage.monthlyCoverage).toBe("unknown");
		expect(output.isDefinitive).toBe(false);
	});

	it.each([
		["malformed deduction", { includedAdditionalDeduction: "invalid" }],
		["negative deduction", { includedAdditionalDeduction: "-0.01" }],
		["negative advance payment", { confirmedAdvancePayments: "-0.01" }],
		["inconsistent fourth aggregate", { fourth: fourthResult({ netFourthIncome: "30000.01" }) }],
		[
			"fourth withholding over fourth gross income",
			{ fourth: fourthResult({ registeredFourthWithholdings: "37500.01" }) },
		],
	] as const)("rejects %s", (_name, override) => {
		expect(() =>
			consolidator.calculate({
				fourth: fourthResult(),
				fifth: fifthResult(),
				includedAdditionalDeduction: "0.00",
				confirmedAdvancePayments: "0.00",
				coverage: coverage(),
				...override,
			}),
		).toThrow(WorkIncomeConsolidatorInputError);
	});
});
