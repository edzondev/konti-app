import { beforeEach, describe, expect, it, vi } from "vitest";

const ENCRYPTION_KEY = "konti_mmkv_encryption_key";

const summary = {
	month: "2026-09",
	totalAmount: 12.5,
	documentCount: 1,
	processingCount: 0,
	insight: "Un gasto.",
	categories: [{ name: "Otros", amount: 12.5 }],
	deductibles: {
		count: 0,
		totalAmount: 0,
		categoryNames: [],
		items: [],
	},
};

const document = {
	status: "ready" as const,
	extractionSource: "qr" as const,
	source: "camera" as const,
	documentType: "boleta" as const,
	category: "restaurantes" as const,
	id: "doc-1",
	issuerName: "Café Lima",
	issuerTaxId: "20123456789",
	issueDate: "2026-09-01",
	documentNumber: "B001-1",
	currencyCode: "PEN",
	totalAmount: "25.50",
	igvAmount: "3.89",
	createdAt: "2026-09-01T12:00:00.000Z",
};

describe("offline read cache loaders", () => {
	beforeEach(async () => {
		vi.resetModules();
		const SecureStore = await import("expo-secure-store");
		await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
		const { getAppStorage, __resetAppStorageForTests } = await import("../core/storage.js");
		__resetAppStorageForTests();
		getAppStorage().clearAll();
	});

	it("loadHomeSummary returns MMKV cache when fetch fails", async () => {
		const { writeCachedHomeSummary, loadHomeSummary } = await import(
			"../features/home/home-summary.js"
		);
		writeCachedHomeSummary("user-1", "2026-09", summary);

		await expect(
			loadHomeSummary("user-1", "2026-09", async () => {
				throw new Error("offline");
			}),
		).resolves.toEqual(summary);
	});

	it("loadHomeSummary rethrows when fetch fails and there is no cache", async () => {
		const { loadHomeSummary } = await import("../features/home/home-summary.js");

		await expect(
			loadHomeSummary("user-1", "2026-09", async () => {
				throw new Error("offline");
			}),
		).rejects.toThrow("offline");
	});

	it("drops the in-memory summary when the user cache is forgotten", async () => {
		const { getAppStorage } = await import("../core/storage.js");
		const { writeCachedHomeSummary, readCachedHomeSummary, forgetHomeSummaryMemory } =
			await import("../features/home/home-summary.js");
		writeCachedHomeSummary("user-1", "2026-09", summary);
		getAppStorage().clearAll();
		forgetHomeSummaryMemory("user-1");

		expect(readCachedHomeSummary("user-1", "2026-09")).toBeUndefined();
	});

	it("loadDocuments returns MMKV cache when fetch fails", async () => {
		const { writeCachedDocuments, loadDocuments } = await import(
			"../features/comprobantes/comprobantes-document.js"
		);
		writeCachedDocuments("user-1", "2026-09", [document]);

		await expect(
			loadDocuments("user-1", "2026-09", async () => {
				throw new Error("offline");
			}),
		).resolves.toEqual([document]);
	});

	it("loadDocuments writes cache on successful fetch", async () => {
		const { getAppStorage } = await import("../core/storage.js");
		const { loadDocuments, readCachedDocuments } = await import(
			"../features/comprobantes/comprobantes-document.js"
		);

		await expect(
			loadDocuments("user-1", "2026-09", async () => [document]),
		).resolves.toEqual([document]);
		expect(getAppStorage().getString("user_user-1_documents_2026-09")).toBe(
			JSON.stringify([document]),
		);
		expect(readCachedDocuments("user-1", "2026-09")).toEqual([document]);
	});
});
