import { describe, expect, it } from "vitest";

import { groupDocumentsByDay } from "./group-documents-by-day";
import type { DocumentListItem } from "./types";

const now = new Date("2026-08-19T15:00:00.000Z");

function document(createdAt: string): DocumentListItem {
	return {
		id: createdAt,
		status: "uploaded",
		source: "camera",
		createdAt,
		originalFileName: "receipt.jpg",
		mimeType: "image/jpeg",
		previewUrl: "https://example.com/receipt.jpg",
		previewExpiresAt: "2026-08-20T15:00:00.000Z",
	};
}

describe("groupDocumentsByDay", () => {
	it("groups items as Hoy, Ayer, and older Lima calendar days", () => {
		const result = groupDocumentsByDay(
			[
				document("2026-08-19T05:00:00.000Z"),
				document("2026-08-19T04:59:59.000Z"),
				document("2026-08-17T18:00:00.000Z"),
			],
			now,
		);

		expect(result.map(({ title, items }) => ({ title, ids: items.map(({ id }) => id) }))).toEqual([
			{ title: "Hoy", ids: ["2026-08-19T05:00:00.000Z"] },
			{ title: "Ayer", ids: ["2026-08-19T04:59:59.000Z"] },
			{ title: "17 ago.", ids: ["2026-08-17T18:00:00.000Z"] },
		]);
	});

	it("keeps items from the same day in a single section", () => {
		const result = groupDocumentsByDay(
			[document("2026-08-18T16:00:00.000Z"), document("2026-08-18T12:00:00.000Z")],
			now,
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.title).toBe("Ayer");
		expect(result[0]?.items).toHaveLength(2);
	});
});
