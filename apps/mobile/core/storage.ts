import * as SecureStore from "expo-secure-store";
import { createMMKV, type MMKV } from "react-native-mmkv";

const SECURE_KEY = "konti_mmkv_encryption_key";
const MMKV_ID = "konti.encrypted";

let instance: MMKV | null = null;

function bytesToHex(bytes: Uint8Array): string {
	return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getOrCreateEncryptionKey(): string {
	const existing = SecureStore.getItem(SECURE_KEY);
	if (existing) return existing;

	const bytes = new Uint8Array(8);
	const webCrypto = (
		globalThis as unknown as { crypto: { getRandomValues: (array: Uint8Array) => Uint8Array } }
	).crypto;
	webCrypto.getRandomValues(bytes);
	const key = bytesToHex(bytes);
	SecureStore.setItem(SECURE_KEY, key);
	return key;
}

/** Synchronous encrypted MMKV — SecureStore key is sync so cache reads stay instant. */
export function getAppStorage(): MMKV {
	if (instance) return instance;
	instance = createMMKV({
		id: MMKV_ID,
		encryptionKey: getOrCreateEncryptionKey(),
		encryptionType: "AES-256",
	});
	return instance;
}

/** Test helper — resets singleton between Vitest cases. */
export function __resetAppStorageForTests(): void {
	instance = null;
}
