import { describe, expect, it } from "vitest";

import { detailFieldRows } from "./document-detail-copy";
import type { DocumentDetail } from "./types";

const penFormatter = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
});
const usdFormatter = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "USD",
});

function document(overrides: Partial<DocumentDetail["document"]> = {}): DocumentDetail["document"] {
	return {
		id: "doc-1",
		status: "ready",
		source: "camera",
		createdAt: "2026-08-12T20:00:00.000Z",
		originalFileName: "receipt.jpg",
		mimeType: "image/jpeg",
		...overrides,
	};
}

function values(rows: ReturnType<typeof detailFieldRows>) {
	return Object.fromEntries(rows.map((row) => [row.label, row.value]));
}

function doubtful(rows: ReturnType<typeof detailFieldRows>) {
	return Object.fromEntries(rows.map((row) => [row.label, row.doubtful]));
}

describe("detailFieldRows", () => {
	it("uses dashes for empty fields in the spec order", () => {
		const rows = detailFieldRows(document());
		expect(rows.map((row) => row.label)).toEqual([
			"RUC",
			"Razón social",
			"Tipo",
			"Serie/número",
			"Fecha",
			"Moneda",
			"Subtotal",
			"IGV",
			"Total",
		]);
		expect(values(rows)).toEqual({
			RUC: "—",
			"Razón social": "—",
			Tipo: "—",
			"Serie/número": "—",
			Fecha: "—",
			Moneda: "—",
			Subtotal: "—",
			IGV: "—",
			Total: "—",
		});
	});

	it("formats extracted fields", () => {
		expect(
			values(
				detailFieldRows(
					document({
						issuerTaxId: "20100070970",
						issuerName: "Rústica",
						documentType: "invoice",
						documentNumber: "F001-148",
						issueDate: "2026-08-12",
						currencyCode: "PEN",
						subtotalAmount: "125.42",
						taxAmount: "22.58",
						totalAmount: "148.00",
					}),
				),
			),
		).toEqual({
			RUC: "20100070970",
			"Razón social": "Rústica",
			Tipo: "Factura",
			"Serie/número": "F001-148",
			Fecha: "12 ago. 2026",
			Moneda: "PEN",
			Subtotal: penFormatter.format(125.42),
			IGV: penFormatter.format(22.58),
			Total: penFormatter.format(148),
		});
	});

	it("formats USD amounts", () => {
		expect(
			values(
				detailFieldRows(
					document({
						currencyCode: "USD",
						totalAmount: "218.50",
					}),
				),
			).Total,
		).toBe(usdFormatter.format(218.5));
	});

	it("marks doubtful fields", () => {
		expect(
			doubtful(
				detailFieldRows(
					document({
						doubtfulFields: ["issuerTaxId", "issueDate", "totalAmount", "documentType"],
					}),
				),
			),
		).toEqual({
			RUC: true,
			"Razón social": false,
			Tipo: true,
			"Serie/número": false,
			Fecha: true,
			Moneda: false,
			Subtotal: false,
			IGV: false,
			Total: true,
		});
	});
});
