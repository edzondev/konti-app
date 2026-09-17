import { vi } from "vitest";

const secureMemory = new Map<string, string>();

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
	getRandomBytesAsync: async (size: number) => Uint8Array.from({ length: size }, (_, i) => i + 1),
}));

const globalWithCrypto = globalThis as typeof globalThis & {
	crypto?: { getRandomValues: <T extends ArrayBufferView>(array: T) => T };
};

if (typeof globalWithCrypto.crypto?.getRandomValues !== "function") {
	globalWithCrypto.crypto = {
		getRandomValues<T extends ArrayBufferView>(array: T): T {
			const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
			for (let i = 0; i < view.length; i++) view[i] = (i + 1) % 256;
			return array;
		},
	};
}

vi.mock("expo-secure-store", () => ({
	getItem: (key: string) => secureMemory.get(key) ?? null,
	setItem: (key: string, value: string) => {
		secureMemory.set(key, value);
	},
	deleteItemAsync: async (key: string) => {
		secureMemory.delete(key);
	},
}));

vi.mock("react-native-mmkv", () => {
	const stores = new Map<string, Map<string, string>>();
	return {
		createMMKV: ({ id }: { id: string }) => {
			if (!stores.has(id)) stores.set(id, new Map());
			const store = stores.get(id)!;
			return {
				getString: (k: string) => store.get(k),
				set: (k: string, v: string) => {
					store.set(k, v);
				},
				remove: (k: string) => {
					store.delete(k);
				},
				clearAll: () => store.clear(),
				getAllKeys: () => [...store.keys()],
			};
		},
	};
});
