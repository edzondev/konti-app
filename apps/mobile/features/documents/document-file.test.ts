import { File } from "expo-file-system";
import { describe, expect, it, vi } from "vitest";

import { localJpegFromCameraFile, prepareLocalFile } from "./document-file";

describe("localJpegFromCameraFile", () => {
	it.each([
		["/cache/capture.jpg", "file:///cache/capture.jpg"],
		["file:///cache/capture.jpg", "file:///cache/capture.jpg"],
	])("normalizes camera path %s without touching image bytes", (filePath, expectedUri) => {
		expect(localJpegFromCameraFile(filePath, "request-1")).toEqual({
			uri: expectedUri,
			fileName: "comprobante-request-1.jpg",
			mimeType: "image/jpeg",
		});
	});
});

describe("prepareLocalFile", () => {
	it("returns upload metadata for a supported local image", async () => {
		await expect(
			prepareLocalFile({
				uri: "file:///cache/receipt.jpg",
				fileName: "receipt.jpg",
				mimeType: "image/jpeg",
			}),
		).resolves.toEqual({
			uri: "file:///cache/receipt.jpg",
			originalFileName: "receipt.jpg",
			mimeType: "image/jpeg",
			sizeBytes: 0,
			sha256: "0".repeat(64),
		});
	});

	it("rejects files larger than 15 MB without reading them", async () => {
		const size = vi.spyOn(File.prototype, "size", "get").mockReturnValue(15 * 1024 * 1024 + 1);
		const bytes = vi.spyOn(File.prototype, "bytes");

		await expect(
			prepareLocalFile({ uri: "file:///cache/receipt.png", mimeType: "image/png" }),
		).rejects.toThrow("15 MB");

		expect(bytes).not.toHaveBeenCalled();
		size.mockRestore();
	});

	it.each(["image/gif", undefined])("rejects unsupported MIME type %s", async (mimeType) => {
		await expect(prepareLocalFile({ uri: "file:///cache/receipt.gif", mimeType })).rejects.toThrow(
			"JPEG or PNG",
		);
	});
});
