import { beforeEach, describe, expect, it, vi } from "vitest";

import { QUERY_KEYS } from "../core/query-keys";

const ENCRYPTION_KEY = "konti_mmkv_encryption_key";

describe("app storage", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("reuses the same MMKV instance across calls", async () => {
		const { getAppStorage, __resetAppStorageForTests } = await import("../core/storage.js");
		__resetAppStorageForTests();
		const a = getAppStorage();
		const b = getAppStorage();
		expect(a).toBe(b);
	});

	it("keeps an existing SecureStore encryption key, including an 8-byte key", async () => {
		const SecureStore = await import("expo-secure-store");
		const existing = "0011223344556677";
		SecureStore.setItem(ENCRYPTION_KEY, existing);
		const crypto = await import("expo-crypto");
		const randomBytes = vi.spyOn(crypto, "getRandomBytes");
		const { getAppStorage, __resetAppStorageForTests } = await import("../core/storage.js");
		__resetAppStorageForTests();

		getAppStorage();

		expect(SecureStore.getItem(ENCRYPTION_KEY)).toBe(existing);
		expect(randomBytes).not.toHaveBeenCalled();
	});

	it("creates a 32-byte encryption key when SecureStore has none", async () => {
		const SecureStore = await import("expo-secure-store");
		await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
		const crypto = await import("expo-crypto");
		const randomBytes = vi.spyOn(crypto, "getRandomBytes");
		const { getAppStorage, __resetAppStorageForTests } = await import("../core/storage.js");
		__resetAppStorageForTests();

		getAppStorage();

		expect(randomBytes).toHaveBeenCalledWith(32);
		expect(SecureStore.getItem(ENCRYPTION_KEY)).toHaveLength(64);
	});
});

describe("query keys", () => {
	it("includes userId from the first argument in every factory key", () => {
		expect(QUERY_KEYS.homeSummary("user-1", "2026-09")).toEqual([
			"home",
			"user-1",
			"summary",
			"2026-09",
		]);
		expect(QUERY_KEYS.documentsMonth("user-1", "2026-09")).toEqual([
			"documents",
			"user-1",
			"2026-09",
		]);
		expect(QUERY_KEYS.documentImage("user-1", "doc-1")).toEqual([
			"documents",
			"user-1",
			"image",
			"doc-1",
		]);
		expect(QUERY_KEYS.deductiblesYear("user-1", 2026)).toEqual([
			"deductibles",
			"user-1",
			"year",
			2026,
		]);
		expect(QUERY_KEYS.deductibles("user-1")).toEqual(["deductibles", "user-1"]);
		expect(QUERY_KEYS.sessions("user-1")).toEqual(["sessions", "user-1"]);
		expect(QUERY_KEYS.home("user-1")).toEqual(["home", "user-1"]);
		expect(QUERY_KEYS.documents("user-1")).toEqual(["documents", "user-1"]);
		expect(QUERY_KEYS.homeRoot).toEqual(["home"]);
		expect(QUERY_KEYS.documentsRoot).toEqual(["documents"]);
		expect(QUERY_KEYS.deductiblesRoot).toEqual(["deductibles"]);
		expect(QUERY_KEYS.sessionsRoot).toEqual(["sessions"]);
	});
});

describe("home summary cache", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("round-trips a summary under user_${userId}_home_summary_${month} and ignores invalid JSON", async () => {
		const SecureStore = await import("expo-secure-store");
		await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
		const { getAppStorage, __resetAppStorageForTests } = await import("../core/storage.js");
		const { clearLocalUserData } = await import("../core/clear-local-user-data.js");
		const { readCachedHomeSummary, writeCachedHomeSummary } = await import(
			"../features/home/home-summary.js"
		);
		__resetAppStorageForTests();

		const summary = {
			month: "2026-09",
			totalAmount: 12.5,
			documentCount: 1,
			processingCount: 2,
			insight: "Un gasto.",
			categories: [{ name: "Otros", amount: 12.5 }],
			deductibles: {
				count: 0,
				totalAmount: 0,
				categoryNames: [],
				items: [],
			},
		};

		writeCachedHomeSummary("user-1", "2026-09", summary);

		expect(getAppStorage().getString("user_user-1_home_summary_2026-09")).toBe(
			JSON.stringify(summary),
		);
		expect(readCachedHomeSummary("user-1", "2026-09")).toEqual(summary);

		getAppStorage().set("user_user-1_home_summary_2026-08", "{");
		expect(readCachedHomeSummary("user-1", "2026-08")).toBeUndefined();

		getAppStorage().set("user_user-1_home_summary_2026-07", JSON.stringify({ month: "2026-07" }));
		expect(readCachedHomeSummary("user-1", "2026-07")).toBeUndefined();

		await clearLocalUserData("user-1");
		expect(getAppStorage().getString("user_user-1_home_summary_2026-09")).toBeUndefined();
	});
});

describe("documents month cache", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("round-trips documents under user_${userId}_documents_${month} and ignores invalid JSON", async () => {
		const SecureStore = await import("expo-secure-store");
		await SecureStore.deleteItemAsync(ENCRYPTION_KEY);
		const { getAppStorage, __resetAppStorageForTests } = await import("../core/storage.js");
		const { clearLocalUserData } = await import("../core/clear-local-user-data.js");
		const { readCachedDocuments, writeCachedDocuments } = await import(
			"../features/comprobantes/comprobantes-document.js"
		);
		__resetAppStorageForTests();

		const documents = [
			{
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
			},
		];

		writeCachedDocuments("user-1", "2026-09", documents);

		expect(getAppStorage().getString("user_user-1_documents_2026-09")).toBe(
			JSON.stringify(documents),
		);
		expect(readCachedDocuments("user-1", "2026-09")).toEqual(documents);

		getAppStorage().set("user_user-1_documents_2026-08", "{");
		expect(readCachedDocuments("user-1", "2026-08")).toBeUndefined();

		getAppStorage().set("user_user-1_documents_2026-07", JSON.stringify([{ id: "x" }]));
		expect(readCachedDocuments("user-1", "2026-07")).toBeUndefined();

		await clearLocalUserData("user-1");
		expect(getAppStorage().getString("user_user-1_documents_2026-09")).toBeUndefined();
	});
});
