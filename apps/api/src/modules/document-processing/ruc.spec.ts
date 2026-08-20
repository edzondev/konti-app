import { isValidPeruRuc } from "./ruc";

describe("isValidPeruRuc", () => {
	it("accepts SUNAT RUC 20100070970", () => {
		expect(isValidPeruRuc("20100070970")).toBe(true);
	});

	it("rejects wrong check digit", () => {
		expect(isValidPeruRuc("20100070971")).toBe(false);
	});

	it("rejects non-11-digit values", () => {
		expect(isValidPeruRuc("2010007097")).toBe(false);
		expect(isValidPeruRuc("201000709701")).toBe(false);
		expect(isValidPeruRuc("20A00070970")).toBe(false);
	});
});
