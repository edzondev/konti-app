import { describe, expect, it } from "vitest";

import { homeActionRoute } from "./home-action";

describe("homeActionRoute", () => {
	it.each([
		["open_capture", "/guardar"],
		["open_tax_income", "/tax-income"],
		["open_tax_status", "/tax-status"],
		["review_document", "/comprobantes"],
		[null, null],
	] as const)("maps %s to %s", (action, route) => {
		expect(homeActionRoute(action)).toBe(route);
	});

	it.each([
		[{ kind: "open_tax_income", incomeMode: "independent" }, "/tax-income-form"],
		[
			{ kind: "open_tax_income", incomeMode: "employment" },
			"/tax-income-form?incomeType=employment",
		],
		[{ kind: "open_tax_income", incomeMode: "mixed" }, "/tax-income"],
	] as const)("routes the first income for the user's profile", (action, route) => {
		expect(homeActionRoute(action)).toBe(route);
	});

	it.each([
		[
			{ kind: "review_rhe_payment", documentId: "document/with spaces" },
			"/document/document%2Fwith%20spaces",
		],
		[
			{ kind: "classify_fourth_activity", documentId: "document-activity" },
			"/document/document-activity",
		],
		[
			{ kind: "resolve_employment_coverage", recordId: "income-1" },
			"/tax-income?type=employment&focus=income-1",
		],
		[
			{ kind: "verify_deduction", deductionId: "deduction-1" },
			"/tax-deduction-form?deductionId=deduction-1",
		],
		[{ kind: "review_monthly_fourth", period: "2026-08" }, "/monthly-fourth/2026-08"],
		[{ kind: "open_annual_review" }, "/tax-status"],
	] as const)("routes the actionable payload %# without losing its target", (action, route) => {
		expect(homeActionRoute(action as never)).toBe(route);
	});

	it("falls back to the relevant collection when an optional target is absent", () => {
		expect(homeActionRoute({ kind: "review_rhe_payment" } as never)).toBe("/comprobantes");
		expect(homeActionRoute({ kind: "resolve_employment_coverage" } as never)).toBe(
			"/tax-income?type=employment",
		);
		expect(homeActionRoute({ kind: "verify_deduction" } as never)).toBe("/tax-deduction-form");
	});
});
