import { describe, expect, it, vi } from "vitest";

import { detailRefetchIntervalMs, listRefetchIntervalMs } from "./documents.queries";
import type { DocumentListItem, DocumentsPage } from "./types";

vi.mock("./documents.api", () => ({
	getDocument: vi.fn(),
	getDocuments: vi.fn(),
}));

function item(overrides: Partial<DocumentListItem> = {}): DocumentListItem {
	return {
		id: "doc-1",
		status: "ready",
		source: "camera",
		createdAt: "2026-08-12T20:00:00.000Z",
		originalFileName: "receipt.jpg",
		mimeType: "image/jpeg",
		previewUrl: "https://example.com/receipt.jpg",
		previewExpiresAt: "2026-08-20T20:00:00.000Z",
		...overrides,
	};
}

function page(items: DocumentListItem[]): DocumentsPage {
	return { items, nextCursor: null };
}

describe("listRefetchIntervalMs", () => {
	it("does not poll when there is no data", () => {
		expect(listRefetchIntervalMs(undefined)).toBe(false);
	});

	it("polls every 2000ms when any item is processing", () => {
		expect(
			listRefetchIntervalMs([
				page([item({ id: "a", status: "ready" })]),
				page([item({ id: "b", status: "processing" })]),
			]),
		).toBe(2000);
	});

	it("does not poll for uploaded, ready, needs_review, or failed", () => {
		expect(
			listRefetchIntervalMs([
				page([
					item({ id: "a", status: "uploaded" }),
					item({ id: "b", status: "ready" }),
					item({ id: "c", status: "needs_review" }),
					item({ id: "d", status: "failed" }),
				]),
			]),
		).toBe(false);
	});
});

describe("detailRefetchIntervalMs", () => {
	it("polls only while processing", () => {
		expect(detailRefetchIntervalMs("processing")).toBe(2000);
		expect(detailRefetchIntervalMs("uploaded")).toBe(false);
		expect(detailRefetchIntervalMs("ready")).toBe(false);
		expect(detailRefetchIntervalMs("failed")).toBe(false);
		expect(detailRefetchIntervalMs(undefined)).toBe(false);
	});
});
