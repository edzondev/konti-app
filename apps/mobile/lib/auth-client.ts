import { expoClient } from "@better-auth/expo/client";
import type { BetterAuthClientPlugin } from "better-auth";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
	throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

export const authClient = createAuthClient({
	baseURL,
	plugins: [
		expoClient({
			scheme: "com.konti.app",
			storagePrefix: "konti",
			storage: SecureStore,
		}) as BetterAuthClientPlugin,
	],
});
