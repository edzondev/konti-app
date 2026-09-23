import { describe, expect, it } from "vitest";

import { yearProgress } from "../features/deductions/deductibles-year-progress";

describe("yearProgress", () => {
	it("returns 0 when total is 0", () => {
		expect(yearProgress(0, 100)).toBe(0);
	});

	it("clamps above 1", () => {
		expect(yearProgress(150, 100)).toBe(1);
	});

	it("returns mid ratio", () => {
		expect(yearProgress(50, 100)).toBe(0.5);
	});

	it("returns 0 when topAmount is 0", () => {
		expect(yearProgress(50, 0)).toBe(0);
	});
});
