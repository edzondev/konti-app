import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
