import {
	type EmploymentIncome2026,
	FifthCategoryRules,
	FifthCategoryRulesInputError,
} from "./fifth-category.rules";

function employment(
	id: string,
	grossAmountPen: string,
	withheldTaxAmountPen: string,
	calculationDisposition: EmploymentIncome2026["calculationDisposition"] = "included",
	override: Partial<EmploymentIncome2026> = {},
): EmploymentIncome2026 {
	return {
		id,
		recordKind: "period",
		coverageStart: "2026-03-01",
		coverageEnd: "2026-03-31",
		coverageScope: "single_payer",
		grossAmountPen,
		withheldTaxAmountPen,
		calculationDisposition,
		payerTaxId: "20123456789",
		payerName: "ACME SAC",
		...override,
	};
}

describe("FifthCategoryRules", () => {
	const rules = new FifthCategoryRules();

	it("sums only included resolved employment records", () => {
		const result = rules.calculate([
			employment("jan-jun", "30000.00", "900.00", "included", {
				coverageStart: "2026-01-01",
				coverageEnd: "2026-06-30",
			}),
			employment("march-covered", "5000.00", "150.00", "excluded_by_coverage"),
			employment("july", "5000.00", "150.00", "included", {
				coverageStart: "2026-07-01",
				coverageEnd: "2026-07-31",
			}),
			employment("ambiguous", "7000.00", "200.00", "needs_resolution"),
		]);

		expect(result).toMatchObject({
			grossFifthIncome: "35000.00",
			registeredFifthWithholdings: "1050.00",
			includedIncomeCount: 2,
			unresolvedIncomeCount: 1,
			incomeCoverage: "partial",
		});
	});

	it("retains multiple employers without projecting unregistered months", () => {
		const result = rules.calculate([
			employment("acme-march", "5000.00", "150.00"),
			employment("beta-july", "6500.00", "260.00", "included", {
				coverageStart: "2026-07-01",
				coverageEnd: "2026-07-31",
				payerTaxId: "20987654321",
				payerName: "Beta SAC",
			}),
		]);

		expect(result.employers).toEqual([
			{ payerTaxId: "20123456789", payerName: "ACME SAC" },
			{ payerTaxId: "20987654321", payerName: "Beta SAC" },
		]);
		expect(result.includedCoverageRanges).toEqual([
			{ start: "2026-03-01", end: "2026-03-31" },
			{ start: "2026-07-01", end: "2026-07-31" },
		]);
		expect(result.includedCoverageStart).toBe("2026-03-01");
		expect(result.includedCoverageEnd).toBe("2026-07-31");
		expect(result.incomeCoverage).toBe("partial");
	});

	it("reports the maximum included coverage end when ranges are nested", () => {
		const result = rules.calculate([
			employment("full-year", "60000.00", "1800.00", "included", {
				coverageStart: "2026-01-01",
				coverageEnd: "2026-12-31",
			}),
			employment("november", "5000.00", "150.00", "included", {
				coverageStart: "2026-11-01",
				coverageEnd: "2026-11-30",
			}),
		]);

		expect(result.includedCoverageStart).toBe("2026-01-01");
		expect(result.includedCoverageEnd).toBe("2026-12-31");
	});

	it("marks twelve registered months as complete without projecting an extra amount", () => {
		const monthly = Array.from({ length: 12 }, (_, index) => {
			const month = String(index + 1).padStart(2, "0");
			const lastDay = new Date(Date.UTC(2026, index + 1, 0)).getUTCDate();
			return employment(`month-${month}`, "1000.00", "30.00", "included", {
				coverageStart: `2026-${month}-01`,
				coverageEnd: `2026-${month}-${lastDay}`,
			});
		});

		const result = rules.calculate(monthly);

		expect(result).toMatchObject({
			grossFifthIncome: "12000.00",
			incomeCoverage: "complete",
			missingMonths: [],
			hasMultipleEmployers: false,
		});
	});

	it("marks an all-employer full-year snapshot as complete", () => {
		const result = rules.calculate([
			employment("all-year", "60000.00", "1800.00", "included", {
				recordKind: "year_to_date_snapshot",
				coverageStart: "2026-01-01",
				coverageEnd: "2026-12-31",
				coverageScope: "all_employers",
				payerTaxId: null,
				payerName: null,
			}),
		]);

		expect(result).toMatchObject({ incomeCoverage: "complete", missingMonths: [] });
	});

	it("reports missing months and multiple employers without projecting them", () => {
		const result = rules.calculate([
			employment("acme-march", "5000.00", "150.00"),
			employment("beta-july", "6500.00", "260.00", "included", {
				coverageStart: "2026-07-01",
				coverageEnd: "2026-07-31",
				payerTaxId: "20987654321",
				payerName: "Beta SAC",
			}),
		]);

		expect(result).toMatchObject({
			missingMonths: [
				"2026-01",
				"2026-02",
				"2026-04",
				"2026-05",
				"2026-06",
				"2026-08",
				"2026-09",
				"2026-10",
				"2026-11",
				"2026-12",
			],
			hasMultipleEmployers: true,
			incomeCoverage: "partial",
		});
	});

	it("returns zero and unknown coverage when no employment record exists", () => {
		expect(rules.calculate([])).toEqual({
			grossFifthIncome: "0.00",
			registeredFifthWithholdings: "0.00",
			includedIncomeCount: 0,
			unresolvedIncomeCount: 0,
			employers: [],
			includedCoverageStart: null,
			includedCoverageEnd: null,
			includedCoverageRanges: [],
			missingMonths: [],
			hasMultipleEmployers: false,
			incomeCoverage: "unknown",
		});
	});

	it("normalizes equivalent decimal inputs without using floating point", () => {
		expect(
			rules.calculate([
				employment("march", "5000.0", "150.0"),
				employment("april", "0.01", "0.00", "included", {
					coverageStart: "2026-04-01",
					coverageEnd: "2026-04-30",
				}),
			]),
		).toMatchObject({
			grossFifthIncome: "5000.01",
			registeredFifthWithholdings: "150.00",
		});
	});

	it("does not mutate employment records or their collection", () => {
		const record = Object.freeze(employment("march", "5000.00", "150.00"));
		const records = Object.freeze([record]);

		expect(() => rules.calculate(records)).not.toThrow();
		expect(records).toEqual([record]);
	});

	it.each([
		["start outside 2026", { coverageStart: "2025-12-01" }],
		["end outside 2026", { coverageEnd: "2027-01-31" }],
		["inverted range", { coverageStart: "2026-04-30", coverageEnd: "2026-04-01" }],
		["zero gross", { grossAmountPen: "0.00" }],
		["malformed gross", { grossAmountPen: "five" }],
		["negative withholding", { withheldTaxAmountPen: "-0.01" }],
		["withholding over gross", { grossAmountPen: "100.00", withheldTaxAmountPen: "100.01" }],
	] as const)("rejects %s", (_name, override) => {
		expect(() =>
			rules.calculate([employment("invalid", "100.00", "0.00", "included", override)]),
		).toThrow(FifthCategoryRulesInputError);
	});
});
