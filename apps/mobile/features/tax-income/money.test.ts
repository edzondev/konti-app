import { describe, expect, it } from "vitest";

import { compareMoney, formatPen, normalizeMoney } from "./money";

describe("money helpers", () => {
	it("normalizes a valid decimal string without using floating point", () => {
		expect(normalizeMoney("2500.5")).toBe("2500.50");
		expect(normalizeMoney("0")).toBe("0.00");
	});

	it("rejects malformed or over-precise values", () => {
		expect(normalizeMoney("1,000.00")).toBeNull();
		expect(normalizeMoney("10.999")).toBeNull();
		expect(normalizeMoney("-1")).toBeNull();
	});

	it("compares decimal strings exactly", () => {
		expect(compareMoney("200.00", "199.99")).toBe(1);
		expect(compareMoney("200", "200.00")).toBe(0);
		expect(compareMoney("0.09", "0.10")).toBe(-1);
	});

	it("formats PEN without converting the amount to a number", () => {
		expect(formatPen("1234567.8")).toBe("S/ 1,234,567.80");
		expect(formatPen("-70.00")).toBe("-S/ 70.00");
	});
});
