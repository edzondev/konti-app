import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();

vi.mock("@/core/api-fetch", () => ({
	apiFetch,
}));

vi.mock("expo-file-system", () => ({ File: class File {} }));

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

describe("documents fetch + cache initialData", () => {
	beforeEach(async () => {
		vi.resetModules();
		apiFetch.mockReset();
		const { __resetAppStorageForTests } = await import("../core/storage.js");
		__resetAppStorageForTests();
	});

	it("serves MMKV cache synchronously for initialData", async () => {
		const { writeDocumentsCache, readDocumentsCache } = await import(
			"../features/documents/document.js"
		);
		writeDocumentsCache("2026-09", [DOC]);
		expect(readDocumentsCache("2026-09")).toEqual([DOC]);
	});

	it("fetchDocuments writes through to MMKV after apiFetch", async () => {
		apiFetch.mockResolvedValue([{ ...DOC, issuerName: "Updated" }]);
		const { fetchDocuments } = await import("../features/documents/use-documents.js");
		const { readDocumentsCache } = await import("../features/documents/document.js");

		const docs = await fetchDocuments("2026-09");
		expect(docs[0]?.issuerName).toBe("Updated");
		expect(apiFetch).toHaveBeenCalledWith("/documents?month=2026-09");
		expect(readDocumentsCache("2026-09")?.[0]?.issuerName).toBe("Updated");
	});
});

describe("DocumentListSchema", () => {
	it("parses list rows and keeps extra fields", async () => {
		const { DocumentListSchema } = await import("../features/documents/document.js");
		const parsed = DocumentListSchema.parse([
			{
				...DOC,
				objectKey: "users/u/documents/x.jpg",
			},
		]);
		expect(parsed[0]?.totalAmount).toBe("10.00");
		expect(parsed[0]).toHaveProperty("objectKey");
	});
});
