import { describe, expect, it } from "vitest";

import {
	additionalDeductionBreakdownRows,
	differenceCopy,
	employmentCoverageCopy,
	fourthIncomeSummaryRows,
	monthlyPeriodRows,
	taxCoverageCopy,
	taxEstimateBreakdown,
	taxEstimateHeadline,
} from "./tax-status-copy";

describe("additionalDeductionBreakdownRows", () => {
	it("separates included, potential and the shared cap with neutral language", () => {
		const rows = additionalDeductionBreakdownRows({
			includedAdditionalDeduction: "1200.00",
			potentialAmountBeforeCap: "500.00",
			capPen: "16500.00",
		});

		expect(rows).toEqual([
			{ label: "Incluido con tus datos registrados", value: "1200.00" },
			{ label: "Aún por revisar", value: "500.00" },
			{ label: "Límite conjunto de 3 UIT", value: "16500.00" },
		]);
		expect(rows.map((row) => row.label).join(" ")).not.toMatch(/aprobado|verificado por sunat/i);
	});
});

describe("differenceCopy", () => {
	it.each([
		["70.00", "La estimación supera los créditos registrados por S/ 70.00."],
		["0.00", "La estimación coincide con los créditos registrados."],
		["-70.00", "Los créditos registrados superan la estimación por S/ 70.00."],
	])("explains %s with neutral language", (difference, expected) => {
		const copy = differenceCopy(difference);
		expect(copy).toBe(expected);
		expect(copy).not.toMatch(/deuda|saldo por pagar|saldo a favor/i);
	});
});

describe("taxCoverageCopy", () => {
	it("explains partial coverage and every excluded factor without definitive language", () => {
		const copy = taxCoverageCopy({
			incomeCoverage: "partial",
			deductionCoverage: "unknown",
			monthlyCoverage: "unknown",
			excludedFactors: [
				"foreign_source_income",
				"prior_year_credit_balance",
				"rent_attribution",
				"other_annual_credit",
				"annual_filing_obligation_not_determined",
				"known_unregistered_information",
			],
		});

		expect(copy.headline).toBe("Estimación parcial");
		expect(copy.rows).toEqual([
			"Ingresos: todavía faltan datos",
			"Gastos deducibles: aún no sabemos si registraste todos",
			"Meses de cuarta: todavía faltan revisiones",
		]);
		expect(copy.exclusions).toHaveLength(6);
		expect(JSON.stringify(copy)).not.toMatch(/definitivo|cumpliste|verificado por sunat/i);
	});
});

describe("monthlyPeriodRows", () => {
	it("separates unreviewed and user-recorded periods without claiming SUNAT compliance", () => {
		expect(
			monthlyPeriodRows([
				{ period: "2026-01", status: "user_recorded_complete" },
				{ period: "2026-02", status: "not_reviewed" },
				{ period: "2026-03", status: "action_likely_required" },
			]),
		).toEqual([
			{ period: "Enero", status: "Información registrada" },
			{ period: "Febrero", status: "Falta revisar" },
			{ period: "Marzo", status: "Podría requerir una acción" },
		]);
	});
});

describe("taxEstimateBreakdown", () => {
	it("exposes every intermediate step of the fourth-category calculation", () => {
		expect(
			taxEstimateBreakdown({
				automaticDeduction20: "20000.00",
				netFourthIncome: "80000.00",
				sevenUitDeduction: "38500.00",
				preliminaryTaxableWorkIncome: "41500.00",
			}),
		).toEqual([
			{ label: "Deducción automática 20%", value: "20000.00" },
			{ label: "Renta neta de cuarta", value: "80000.00" },
			{ label: "Deducción 7 UIT", value: "38500.00" },
			{ label: "Renta preliminar imponible", value: "41500.00" },
		]);
	});

	it("uses the work-income v2 taxable base and never returns an undefined amount", () => {
		const output = {
			rulesetVersion: "pe-2026.2.0",
			taxYear: 2026,
			grossOrdinaryFourthIncome: "10000.00",
			automaticDeduction20: "2000.00",
			netOrdinaryFourthIncome: "8000.00",
			grossSpecialFourthIncome: "0.00",
			netFourthIncome: "8000.00",
			grossFifthIncome: "60000.00",
			combinedNetWorkIncome: "68000.00",
			sevenUitDeduction: "38500.00",
			includedAdditionalDeduction: "1000.00",
			appliedAdditionalDeduction: "1000.00",
			netTaxableWorkIncome: "28500.00",
			calculatedTaxBeforeCredits: "2280.00",
			registeredFourthWithholdings: "800.00",
			registeredFifthWithholdings: "3000.00",
			confirmedAdvancePayments: "0.00",
			registeredCredits: "3800.00",
			differenceAfterRegisteredCredits: "-1520.00",
			includedFourthIncomeCount: 1,
			includedFifthIncomeCount: 12,
			employers: [{ payerTaxId: "20123456789", payerName: "ACME" }],
			employmentCoverageRanges: [{ start: "2026-01-01", end: "2026-12-31" }],
			missingEmploymentMonths: [],
			hasMultipleEmployers: false,
			coverage: {
				incomeCoverage: "complete",
				deductionCoverage: "partial",
				monthlyCoverage: "not_applicable",
				excludedFactors: ["annual_filing_obligation_not_determined"],
			},
			isDefinitive: false,
			status: "calculated",
			grossFourthIncome: "10000.00",
			calculatedTaxBeforeAdditionalDeductions: "2280.00",
			registeredWithholdings: "3800.00",
			differenceAfterRegisteredWithholdings: "-1520.00",
			includedIncomeCount: 13,
			additionalDeductions: {} as never,
		} as const;

		expect(taxEstimateHeadline(output)).toEqual({
			label: "Renta neta imponible registrada",
			value: "28500.00",
		});
		const rows = taxEstimateBreakdown(output);
		expect(rows).toContainEqual({ label: "Renta neta imponible", value: "28500.00" });
		expect(rows.every((row) => typeof row.value === "string")).toBe(true);
	});
});

describe("employmentCoverageCopy", () => {
	it("explains multiple employers and missing months without projecting them", () => {
		expect(
			employmentCoverageCopy({
				hasMultipleEmployers: true,
				missingEmploymentMonths: ["2026-02", "2026-03"],
			}),
		).toEqual([
			"Registraste ingresos de más de una empresa. Revisa que no se repitan periodos.",
			"Faltan febrero y marzo. No los proyectamos ni asumimos ingresos.",
		]);
	});
});

describe("fourthIncomeSummaryRows", () => {
	it("separates ordinary work from special fourth-category activities", () => {
		expect(
			fourthIncomeSummaryRows({
				grossFourthIncome: "110000.00",
				grossOrdinaryFourthIncome: "100000.00",
				grossSpecialFourthIncome: "10000.00",
			}),
		).toEqual([
			{ label: "Servicios de cuarta", value: "100000.00" },
			{ label: "Cargos especiales de cuarta", value: "10000.00" },
		]);
	});
});
