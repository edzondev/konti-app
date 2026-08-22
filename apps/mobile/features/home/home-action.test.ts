import { describe, expect, it } from "vitest";

import { homeActionRoute } from "./home-action";

describe("homeActionRoute", () => {
	it.each([
		["open_capture", "/guardar"],
		["open_tax_income", "/tax-income-form"],
		["open_tax_status", "/tax-status"],
		["review_document", "/comprobantes"],
		[null, null],
	] as const)("maps %s to %s", (action, route) => {
		expect(homeActionRoute(action)).toBe(route);
	});
});
