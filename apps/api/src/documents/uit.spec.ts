import { Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getUit } from "./uit.js";

describe("getUit", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns known UIT values", () => {
		expect(getUit(2024)).toBe(5150);
		expect(getUit(2025)).toBe(5350);
		expect(getUit(2026)).toBe(5500);
	});

	it("falls back to max-year UIT and warns for unknown year", () => {
		const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);

		expect(getUit(2099)).toBe(5500);
		expect(warn).toHaveBeenCalled();
	});
});
