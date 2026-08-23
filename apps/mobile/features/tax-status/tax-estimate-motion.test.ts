import { describe, expect, it } from "vitest";

import { taxEstimateRowDelay } from "./tax-estimate-motion";

describe("tax estimate breakdown motion", () => {
	it("uses a short capped stagger for explanatory rows", () => {
		expect([0, 1, 2, 8].map((index) => taxEstimateRowDelay(index, false))).toEqual([
			0, 24, 48, 144,
		]);
	});

	it("removes the stagger when the system requests reduced motion", () => {
		expect(taxEstimateRowDelay(4, true)).toBe(0);
	});
});
