import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
	throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

const client = createAuthClient({
	baseURL,
	plugins: [
		// Types of @better-auth/expo lag the BetterAuthClientPlugin interface.
		expoClient({
			scheme: "com.konti.app",
			storagePrefix: "konti",
			storage: SecureStore,
		}) as any,
	],
});

export const authClient = client as typeof client & {
	getCookie: () => string;
};

export type Session = NonNullable<ReturnType<typeof authClient.useSession>["data"]>;
