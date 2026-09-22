import { beforeEach, describe, expect, it, vi } from "vitest";

const DOC = {
	id: "11111111-1111-4111-8111-111111111111",
	status: "ready" as const,
	issuerName: "ACME",
	totalAmount: "10.00",
	currencyCode: "PEN",
	issueDate: "2026-09-01",
	category: "otros",
	documentType: "boleta",
};

describe("documents cache", () => {
	beforeEach(async () => {
		vi.resetModules();
		const { __resetAppStorageForTests } = await import("../core/storage.js");
		__resetAppStorageForTests();
	});

	it("round-trips documents for a month and clears them", async () => {
		const { writeDocumentsCache, readDocumentsCache, clearDocumentsCache } = await import(
			"../features/documents/document.js"
		);

		writeDocumentsCache("2026-09", [DOC]);
		expect(readDocumentsCache("2026-09")).toEqual([DOC]);

		clearDocumentsCache();
		expect(readDocumentsCache("2026-09")).toBeUndefined();
	});

	it("formats current Lima month as YYYY-MM", async () => {
		const { currentLimaMonth } = await import("../features/documents/document-ui.js");
		expect(currentLimaMonth(new Date("2026-09-17T18:00:00Z"))).toMatch(/^\d{4}-\d{2}$/);
	});

	it("clearLocalDocuments wipes MMKV and React Query documents keys", async () => {
		const { writeDocumentsCache, readDocumentsCache, clearLocalDocuments } = await import(
			"../features/documents/document.js"
		);
		const { QUERY_KEYS } = await import("../core/query-keys.js");
		const { queryClient } = await import("../core/query-provider.js");

		writeDocumentsCache("2026-09", [DOC]);
		queryClient.setQueryData(QUERY_KEYS.documentsMonth("2026-09"), [DOC]);

		clearLocalDocuments();

		expect(readDocumentsCache("2026-09")).toBeUndefined();
		expect(queryClient.getQueryData(QUERY_KEYS.documentsMonth("2026-09"))).toBeUndefined();
	});
});
