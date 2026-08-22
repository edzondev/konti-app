import { describe, expect, it } from "vitest";

import { differenceCopy, taxEstimateBreakdown } from "./tax-status-copy";

describe("differenceCopy", () => {
	it.each([
		["70.00", "La estimación supera las retenciones registradas por S/ 70.00."],
		["0.00", "La estimación coincide con las retenciones registradas."],
		["-70.00", "Las retenciones registradas superan la estimación por S/ 70.00."],
	])("explains %s with neutral language", (difference, expected) => {
		const copy = differenceCopy(difference);
		expect(copy).toBe(expected);
		expect(copy).not.toMatch(/deuda|crédito|saldo por pagar|saldo a favor/i);
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
});
