import * as SecureStore from "expo-secure-store";

import { getAppStorage } from "@/core/storage";

/** Better Auth Expo (`storagePrefix: "konti"`) — see `@better-auth/expo` client.js */
const AUTH_SECURE_KEYS = ["konti_cookie", "konti_session_data"] as const;

async function deleteSecureKey(key: string): Promise<void> {
	try {
		await SecureStore.deleteItemAsync(key);
	} catch {
		/* ignore missing / platform errors */
	}
}

export async function clearLocalUserData(userId: string): Promise<void> {
	const storage = getAppStorage();
	const prefix = `user_${userId}_`;
	for (const key of storage.getAllKeys()) {
		if (key.startsWith(prefix)) storage.remove(key);
	}

	await Promise.all(AUTH_SECURE_KEYS.map(deleteSecureKey));
}
