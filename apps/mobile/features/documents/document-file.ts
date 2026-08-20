import { digest, CryptoDigestAlgorithm } from "expo-crypto";
import { File } from "expo-file-system";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

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
	if (!isSupportedImageMime(file.mimeType)) {
		throw new Error("Only JPEG or PNG images can be uploaded.");
	}

	const local = new File(file.uri);
	if (local.size > MAX_IMAGE_BYTES) {
		throw new Error("Images must be 15 MB or smaller.");
	}

	const hash = await digest(CryptoDigestAlgorithm.SHA256, await local.bytes());
	const sha256 = Array.from(new Uint8Array(hash), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");

	return {
		uri: file.uri,
		originalFileName: file.fileName ?? fileNameFromUri(file.uri),
		mimeType: file.mimeType,
		sizeBytes: local.size,
		sha256,
	};
}
