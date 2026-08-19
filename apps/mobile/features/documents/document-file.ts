const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

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

export type PrepareLocalFileDependencies = {
	getSize(uri: string): Promise<number>;
	readBytes(uri: string): Promise<Uint8Array>;
	sha256(bytes: Uint8Array): Promise<string>;
};

function isSupportedMimeType(mimeType: string | null | undefined): mimeType is "image/jpeg" | "image/png" {
	return mimeType === "image/jpeg" || mimeType === "image/png";
}

function fileNameFromUri(uri: string): string {
	const name = uri.split("/").pop()?.split("?")[0];
	return name ? decodeURIComponent(name) : "document";
}

async function defaultDependencies(): Promise<PrepareLocalFileDependencies> {
	const [{ File }, crypto] = await Promise.all([import("expo-file-system"), import("expo-crypto")]);

	return {
		getSize: async (uri) => new File(uri).size,
		readBytes: async (uri) => new File(uri).bytes(),
		sha256: async (bytes) => {
			const digest = await crypto.digest(crypto.CryptoDigestAlgorithm.SHA256, bytes);
			return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
		},
	};
}

export async function prepareLocalFile(
	file: LocalImageFile,
	dependencies: PrepareLocalFileDependencies | undefined = undefined,
): Promise<PreparedLocalFile> {
	if (!isSupportedMimeType(file.mimeType) || !SUPPORTED_MIME_TYPES.has(file.mimeType)) {
		throw new Error("Only JPEG or PNG images can be uploaded.");
	}

	const deps = dependencies ?? (await defaultDependencies());
	const sizeBytes = await deps.getSize(file.uri);
	if (sizeBytes > MAX_IMAGE_BYTES) {
		throw new Error("Images must be 15 MB or smaller.");
	}

	const sha256 = await deps.sha256(await deps.readBytes(file.uri));
	if (!SHA256_PATTERN.test(sha256)) {
		throw new Error("SHA-256 must be a 64-character lowercase hexadecimal digest.");
	}

	return {
		uri: file.uri,
		originalFileName: file.fileName ?? fileNameFromUri(file.uri),
		mimeType: file.mimeType,
		sizeBytes,
		sha256,
	};
}
