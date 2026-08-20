import { describe, expect, it } from "vitest";

import { listAmount, listSubtitle, listTitle } from "./document-list-copy";
import type { DocumentListItem } from "./types";

function item(overrides: Partial<DocumentListItem> = {}): DocumentListItem {
	return {
		id: "doc-1",
		status: "uploaded",
		source: "camera",
		createdAt: "2026-08-12T20:00:00.000Z",
		originalFileName: "receipt.jpg",
		mimeType: "image/jpeg",
		previewUrl: "https://example.com/receipt.jpg",
		previewExpiresAt: "2026-08-20T20:00:00.000Z",
		...overrides,
	};
}

describe("listTitle", () => {
	it("uses issuerName when present", () => {
		expect(listTitle(item({ issuerName: "Rústica" }))).toBe("Rústica");
	});

	it("falls back to Cámara for camera uploads without issuerName", () => {
		expect(listTitle(item({ source: "camera", issuerName: null }))).toBe("Cámara");
	});

	it("falls back to Galería for gallery uploads without issuerName", () => {
		expect(listTitle(item({ source: "gallery", issuerName: null }))).toBe("Galería");
	});
});

describe("listAmount", () => {
	const penFormatter = new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: "PEN",
	});
	const usdFormatter = new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: "USD",
	});

	it("returns null when totalAmount is missing", () => {
		expect(listAmount(item())).toBeNull();
	});

	it("formats PEN amounts with es-PE", () => {
		expect(listAmount(item({ totalAmount: "148.00", currencyCode: "PEN" }))).toBe(
			penFormatter.format(148),
		);
	});

	it("formats USD amounts with es-PE", () => {
		expect(listAmount(item({ totalAmount: "218.50", currencyCode: "USD" }))).toBe(
			usdFormatter.format(218.5),
		);
	});
});

describe("listSubtitle", () => {
	it("shows Guardado in primary tone for uploaded", () => {
		expect(listSubtitle(item({ status: "uploaded" }))).toEqual({
			text: "Guardado",
			tone: "primary",
		});
	});

	it("shows Leyendo tu comprobante in muted tone for processing", () => {
		expect(listSubtitle(item({ status: "processing" }))).toEqual({
			text: "Leyendo tu comprobante",
			tone: "muted",
		});
	});

	it("shows document type and issue date for ready receipts", () => {
		expect(
			listSubtitle(
				item({
					status: "ready",
					documentType: "receipt",
					issueDate: "2026-08-12",
				}),
			),
		).toEqual({
			text: "Boleta · 12 ago. 2026",
			tone: "muted",
		});
	});

	it("maps invoice, fee_receipt, and payroll_slip labels", () => {
		expect(
			listSubtitle(item({ status: "ready", documentType: "invoice", issueDate: "2026-08-12" })),
		).toEqual({ text: "Factura · 12 ago. 2026", tone: "muted" });
		expect(
			listSubtitle(item({ status: "ready", documentType: "fee_receipt", issueDate: "2026-08-12" })),
		).toEqual({ text: "Recibo · 12 ago. 2026", tone: "muted" });
		expect(
			listSubtitle(
				item({ status: "ready", documentType: "payroll_slip", issueDate: "2026-08-12" }),
			),
		).toEqual({ text: "Boleta de pago · 12 ago. 2026", tone: "muted" });
	});

	it("uses createdAt when issueDate is missing", () => {
		expect(
			listSubtitle(
				item({
					status: "ready",
					documentType: "receipt",
					createdAt: "2026-08-12T20:00:00.000Z",
				}),
			),
		).toEqual({
			text: "Boleta · 12 ago. 2026",
			tone: "muted",
		});
	});

	it("omits unknown document types from ready subtitle", () => {
		expect(
			listSubtitle(item({ status: "ready", documentType: "unknown", issueDate: "2026-08-12" })),
		).toEqual({
			text: "12 ago. 2026",
			tone: "muted",
		});
	});

	it("maps the first doubtful field for needs_review", () => {
		expect(
			listSubtitle(
				item({
					status: "needs_review",
					doubtfulFields: ["issuerTaxId", "totalAmount"],
				}),
			),
		).toEqual({ text: "Falta el RUC", tone: "gold" });
		expect(listSubtitle(item({ status: "needs_review", doubtfulFields: ["issueDate"] }))).toEqual({
			text: "Falta la fecha",
			tone: "gold",
		});
		expect(listSubtitle(item({ status: "needs_review", doubtfulFields: ["totalAmount"] }))).toEqual(
			{ text: "Falta el total", tone: "gold" },
		);
		expect(
			listSubtitle(item({ status: "needs_review", doubtfulFields: ["documentType"] })),
		).toEqual({ text: "Falta el tipo", tone: "gold" });
	});

	it("shows No se pudo leer in muted tone for failed", () => {
		expect(listSubtitle(item({ status: "failed" }))).toEqual({
			text: "No se pudo leer",
			tone: "muted",
		});
	});
});
