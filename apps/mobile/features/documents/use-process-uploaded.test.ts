import { describe, expect, it, vi } from "vitest";

import type { DocumentListItem } from "./types";
import { uploadedIdsToProcess } from "./use-process-uploaded";

vi.mock("./documents.api", () => ({
	processDocument: vi.fn(),
}));

vi.mock("./documents.queries", () => ({
	documentKeys: { all: ["documents"] },
}));

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

describe("uploadedIdsToProcess", () => {
	it("waits until items are available", () => {
		expect(uploadedIdsToProcess(undefined, false)).toEqual({
			nextDrained: false,
			ids: [],
		});
	});

	it("marks the session drained even when nothing is uploaded", () => {
		expect(uploadedIdsToProcess([item({ status: "ready" })], false)).toEqual({
			nextDrained: true,
			ids: [],
		});
	});

	it("returns only uploaded ids and marks drained", () => {
		expect(
			uploadedIdsToProcess(
				[
					item({ id: "a", status: "uploaded" }),
					item({ id: "b", status: "processing" }),
					item({ id: "c", status: "uploaded" }),
					item({ id: "d", status: "failed" }),
				],
				false,
			),
		).toEqual({
			nextDrained: true,
			ids: ["a", "c"],
		});
	});

	it("is a no-op after the session has already drained", () => {
		expect(uploadedIdsToProcess([item({ id: "a", status: "uploaded" })], true)).toEqual({
			nextDrained: true,
			ids: [],
		});
	});
});
