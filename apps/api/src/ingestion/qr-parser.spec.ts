import { describe, expect, it } from "vitest";
import { parseQrPayload } from "./qr-parser.js";

describe("parseQrPayload", () => {
	it("parsea un QR SUNAT típico de boleta", () => {
		const result = parseQrPayload("20543722309|03|BC35|00105975|18.56|111.35|2026-08-21");

		expect(result).toEqual({
			documentType: "boleta",
			issuerName: null,
			issuerTaxId: "20543722309",
			issueDate: "2026-08-21",
			documentNumber: "BC35-00105975",
			currencyCode: "PEN",
			totalAmount: "111.35",
			igvAmount: "18.56",
		});
	});

	it("devuelve null con basura no parseable", () => {
		expect(parseQrPayload("basura")).toBeNull();
		expect(parseQrPayload("")).toBeNull();
		expect(parseQrPayload("   ")).toBeNull();
	});

	it("toma el monto mayor como total cuando hay varios con 2 decimales", () => {
		const result = parseQrPayload("20543722309|03|B001|123|10.00|100.00|2026-01-15");
		expect(result?.totalAmount).toBe("100.00");
		expect(result?.igvAmount).toBe("10.00");
	});
});
