import { describe, expect, it } from "vitest";
import * as v from "valibot";

import { DocumentSchema } from "@/features/comprobantes/comprobantes-document";

const document = {
	id: "document-1",
	status: "ready",
	source: "camera",
	documentType: "boleta",
	category: "otros",
	issuerName: null,
	issuerTaxId: null,
	issueDate: null,
	documentNumber: null,
	currencyCode: null,
	totalAmount: null,
	igvAmount: null,
	createdAt: "2026-09-22T12:00:00.000Z",
};

describe("DocumentSchema extractionSource", () => {
	it("rejects local and accepts qr, ocr, manual, and null", () => {
		expect(v.safeParse(DocumentSchema, { ...document, extractionSource: "local" }).success).toBe(
			false,
		);
		for (const extractionSource of ["qr", "ocr", "manual", null] as const) {
			expect(v.safeParse(DocumentSchema, { ...document, extractionSource }).success).toBe(true);
		}
	});
});
