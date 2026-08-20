import { vi } from "vitest";

vi.mock("expo-file-system", () => ({
	File: class File {
		constructor(public readonly uri: string) {}
		get size() {
			return 0;
		}
		async bytes() {
			return new Uint8Array();
		}
		async upload() {
			return { status: 200, body: "", headers: {} };
		}
	},
}));

vi.mock("expo-crypto", () => ({
	CryptoDigestAlgorithm: { SHA256: "SHA-256" },
	digest: async () => new ArrayBuffer(32),
}));
