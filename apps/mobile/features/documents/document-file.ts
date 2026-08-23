import { CryptoDigestAlgorithm, digest } from "expo-crypto";
import { File } from "expo-file-system";
import { createDevLogger } from "@/core/dev-logger";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const performanceLog = createDevLogger("documents.performance");

export type LocalImageFile = {
	uri: string;
	fileName?: string | null;
	mimeType?: string | null;
};

export type PreparedLocalFile = {
	uri: string;
	originalFileName: string;
	mimeType: "image/jpeg" | "image/png";
	sizeBytes: number;
	sha256: string;
};

export function localJpegFromCameraFile(filePath: string, idempotencyKey: string): LocalImageFile {
	return {
		uri: filePath.startsWith("file://") ? filePath : `file://${filePath}`,
		fileName: `comprobante-${idempotencyKey}.jpg`,
		mimeType: "image/jpeg",
	};
}

export function isSupportedImageMime(
	mimeType: string | null | undefined,
): mimeType is "image/jpeg" | "image/png" {
	return mimeType === "image/jpeg" || mimeType === "image/png";
}

function fileNameFromUri(uri: string): string {
	const name = uri.split("/").pop()?.split("?")[0];
	return name ? decodeURIComponent(name) : "document";
}

export async function prepareLocalFile(file: LocalImageFile): Promise<PreparedLocalFile> {
	const startedAt = Date.now();
	if (!isSupportedImageMime(file.mimeType)) {
		throw new Error("Only JPEG or PNG images can be uploaded.");
	}

	const local = new File(file.uri);
	if (local.size > MAX_IMAGE_BYTES) {
		throw new Error("Images must be 15 MB or smaller.");
	}

	const readStartedAt = Date.now();
	const bytes = await local.bytes();
	const readDurationMs = Date.now() - readStartedAt;
	const digestStartedAt = Date.now();
	const hash = await digest(CryptoDigestAlgorithm.SHA256, bytes);
	const digestDurationMs = Date.now() - digestStartedAt;
	const sha256 = Array.from(new Uint8Array(hash), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
	performanceLog.info("prepareLocalFile:completed", {
		sizeBytes: local.size,
		readDurationMs,
		digestDurationMs,
		totalDurationMs: Date.now() - startedAt,
	});

	return {
		uri: file.uri,
		originalFileName: file.fileName ?? fileNameFromUri(file.uri),
		mimeType: file.mimeType,
		sizeBytes: local.size,
		sha256,
	};
}
