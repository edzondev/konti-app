import { describe, expect, it } from "vitest";

import type { Document } from "@/features/comprobantes/comprobantes-document";
import {
	DOCUMENT_TYPE_LABELS,
	toEditDraft,
	toUpdatePayload,
	validateDraft,
} from "@/features/comprobantes/document-form";

function doc(partial: Partial<Document> = {}): Document {
	return {
		id: "document-1",
		status: "ready",
		source: "camera",
		documentType: "boleta",
		category: "otros",
		extractionSource: null,
		issuerName: null,
		issuerTaxId: null,
		issueDate: null,
		documentNumber: null,
		currencyCode: null,
		totalAmount: null,
		igvAmount: null,
		createdAt: "2026-09-22T12:00:00.000Z",
		...partial,
	};
}

describe("toEditDraft", () => {
	it("seeds editable values and formats the issue date", () => {
		expect(
			toEditDraft(
				doc({
					issuerName: "Plaza Vea",
					issuerTaxId: "20123456789",
					issueDate: "2026-09-22",
					documentType: "factura",
					documentNumber: "F001-42",
					totalAmount: "10.50",
					igvAmount: "1.89",
					category: "supermercado",
				}),
			),
		).toEqual({
			issuerName: "Plaza Vea",
			issuerTaxId: "20123456789",
			issueDate: "22/09/2026",
			documentType: "factura",
			documentNumber: "F001-42",
			totalAmount: "10.50",
			igvAmount: "1.89",
			category: "supermercado",
		});
	});
});

describe("validateDraft", () => {
	it("returns field errors for invalid RUC, date, and amounts", () => {
		const draft = toEditDraft(doc());

		expect(
			validateDraft({
				...draft,
				issuerTaxId: "123",
				issueDate: "31/02/2026",
				totalAmount: "10.999",
				igvAmount: "abc",
			}),
		).toEqual({
			issuerTaxId: "RUC inválido",
			issueDate: "Fecha inválida",
			totalAmount: "Monto inválido",
			igvAmount: "Monto inválido",
		});
	});

	it("accepts empty optional fields and a decimal comma", () => {
		const draft = toEditDraft(doc());

		expect(validateDraft({ ...draft, totalAmount: "10,50" })).toEqual({});
	});
});

describe("toUpdatePayload", () => {
	it("returns only changed fields and sends category only when it changes", () => {
		const original = doc({
			issuerName: "Plaza Vea",
			issueDate: "2026-09-22",
			totalAmount: "10.00",
			category: "otros",
		});
		const draft = toEditDraft(original);
		const payload = toUpdatePayload(original, { ...draft, issuerName: "Wong" });

		expect(payload).toEqual({ issuerName: "Wong" });
		expect(payload).not.toHaveProperty("category");
		expect(toUpdatePayload(original, { ...draft, category: "restaurantes" })).toEqual({
			category: "restaurantes",
		});
	});

	it("returns null when the draft is unchanged", () => {
		const original = doc({
			issuerName: "Plaza Vea",
			issueDate: "2026-09-22",
			totalAmount: "10.00",
		});

		expect(toUpdatePayload(original, toEditDraft(original))).toBeNull();
	});

	it("normalizes changed dates, decimal commas, and blank text", () => {
		const original = doc({
			issuerName: "Plaza Vea",
			issueDate: "2026-09-22",
			totalAmount: "10.00",
		});

		expect(
			toUpdatePayload(original, {
				...toEditDraft(original),
				issuerName: " ",
				issueDate: "23/09/2026",
				totalAmount: "12,50",
			}),
		).toEqual({
			issuerName: null,
			issueDate: "2026-09-23",
			totalAmount: "12.50",
		});
	});
});

describe("DOCUMENT_TYPE_LABELS", () => {
	it("provides the labels used by document views and forms", () => {
		expect(DOCUMENT_TYPE_LABELS).toEqual({
			boleta: "Boleta",
			factura: "Factura",
			recibo_honorarios: "Recibo por honorarios",
			ticket: "Ticket",
			unknown: "Sin completar",
		});
	});
});
