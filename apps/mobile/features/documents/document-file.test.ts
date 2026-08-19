import { describe, expect, it } from "vitest";

import { prepareLocalFile, type PrepareLocalFileDependencies } from "./document-file";

const dependencies: PrepareLocalFileDependencies = {
	getSize: async () => 42,
	readBytes: async () => new Uint8Array([1, 2, 3]),
	sha256: async () => "a".repeat(64),
};

describe("prepareLocalFile", () => {
	it("returns upload metadata for a supported local image", async () => {
		await expect(
			prepareLocalFile(
				{
					uri: "file:///cache/receipt.jpg",
					fileName: "receipt.jpg",
					mimeType: "image/jpeg",
				},
				dependencies,
			),
		).resolves.toEqual({
			uri: "file:///cache/receipt.jpg",
			originalFileName: "receipt.jpg",
			mimeType: "image/jpeg",
			sizeBytes: 42,
			sha256: "a".repeat(64),
		});
	});

	it("rejects files larger than 15 MB without reading them", async () => {
		let read = false;

		await expect(
			prepareLocalFile(
				{ uri: "file:///cache/receipt.png", mimeType: "image/png" },
				{
					...dependencies,
					getSize: async () => 15 * 1024 * 1024 + 1,
					readBytes: async () => {
						read = true;
						return new Uint8Array();
					},
				},
			),
		).rejects.toThrow("15 MB");

		expect(read).toBe(false);
	});

	it.each(["image/gif", undefined])("rejects unsupported MIME type %s", async (mimeType) => {
		await expect(
			prepareLocalFile({ uri: "file:///cache/receipt.gif", mimeType }, dependencies),
		).rejects.toThrow("JPEG or PNG");
	});

	it("rejects a digest that is not 64 lowercase hexadecimal characters", async () => {
		await expect(
			prepareLocalFile(
				{ uri: "file:///cache/receipt.jpg", mimeType: "image/jpeg" },
				{ ...dependencies, sha256: async () => "A".repeat(64) },
			),
		).rejects.toThrow("SHA-256");
	});
});
