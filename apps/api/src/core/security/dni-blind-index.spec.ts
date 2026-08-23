import { createDniBlindIndex } from "./dni-blind-index";

describe("createDniBlindIndex", () => {
	it("is deterministic, domain-separated and never returns the DNI", () => {
		const first = createDniBlindIndex("12345678", "a-secret-key-for-tests-with-32-bytes");
		const second = createDniBlindIndex("12345678", "a-secret-key-for-tests-with-32-bytes");

		expect(first).toEqual(second);
		expect(first.blindIndex).toMatch(/^[a-f0-9]{64}$/);
		expect(first.blindIndex).not.toContain("12345678");
		expect(first.last4).toBe("5678");
	});

	it.each(["", "123", "123456789", "abcdefgh"])("rejects invalid DNI %s", (dni) => {
		expect(() => createDniBlindIndex(dni, "a-secret-key-for-tests-with-32-bytes")).toThrow();
	});

	it("rejects a missing HMAC secret", () => {
		expect(() => createDniBlindIndex("12345678", "short-secret")).toThrow();
	});
});
