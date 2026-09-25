import { describe, expect, it } from "vitest";

import type { Document } from "@/features/comprobantes/comprobantes-document";
import { resolveOpenDocument } from "@/features/comprobantes/open-document";

function doc(partial: Partial<Document> & Pick<Document, "id">): Document {
	return {
		status: "ready",
		source: "camera",
		documentType: "boleta",
		category: "otros",
		extractionSource: null,
		issuerName: null,
		issuerTaxId: null,
		issueDate: "2026-08-01",
		documentNumber: null,
		currencyCode: null,
		totalAmount: null,
		igvAmount: null,
		createdAt: "2026-08-01T12:00:00.000Z",
		...partial,
	};
}

describe("resolveOpenDocument", () => {
	it("returns null when nothing is open", () => {
		expect(resolveOpenDocument(null, null, [], 10, 0)).toBeNull();
	});

	it("keeps the saved document when the month list has not caught up", () => {
		const saved = doc({ id: "1", issueDate: "2026-09-24" });
		const stale = doc({ id: "1", issueDate: "2026-08-01" });

		expect(resolveOpenDocument("1", saved, [stale], 1_000, 2_000)).toBe(saved);
	});

	it("keeps the open document after it leaves the current month", () => {
		const saved = doc({ id: "1", issueDate: "2026-09-24" });

		expect(resolveOpenDocument("1", saved, [], 3_000, 2_000)).toBe(saved);
	});

	it("uses the refreshed row once the list is newer than the save", () => {
		const saved = doc({ id: "1", issueDate: "2026-09-24" });
		const fresh = doc({ id: "1", issueDate: "2026-09-24", issuerName: "Bodega" });

		expect(resolveOpenDocument("1", saved, [fresh], 3_000, 2_000)).toBe(fresh);
	});
});
