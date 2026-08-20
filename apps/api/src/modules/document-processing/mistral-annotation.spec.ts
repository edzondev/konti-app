import { OcrResultInvalidError, parseDocumentAnnotation } from "./mistral-annotation";

describe("parseDocumentAnnotation", () => {
	it("parses a JSON string annotation", () => {
		expect(parseDocumentAnnotation('{"issuerTaxId":"20100070970"}').issuerTaxId).toBe(
			"20100070970",
		);
	});

	it("parses an object annotation", () => {
		expect(parseDocumentAnnotation({ issuerTaxId: "20100070970" }).issuerTaxId).toBe("20100070970");
	});

	it("returns null for missing fields", () => {
		expect(parseDocumentAnnotation("{}")).toEqual({
			issuerTaxId: null,
			issuerName: null,
			issueDate: null,
			documentType: null,
			documentNumber: null,
			currency: null,
			subtotalAmount: null,
			taxAmount: null,
			totalAmount: null,
		});
	});

	it("throws OCR_RESULT_INVALID for invalid JSON", () => {
		expect(() => parseDocumentAnnotation("not-json")).toThrow(OcrResultInvalidError);
		expect(() => parseDocumentAnnotation("not-json")).toThrow("OCR_RESULT_INVALID");
	});

	it("throws OCR_RESULT_INVALID for empty annotation", () => {
		expect(() => parseDocumentAnnotation("")).toThrow("OCR_RESULT_INVALID");
		expect(() => parseDocumentAnnotation(null)).toThrow("OCR_RESULT_INVALID");
	});
});
