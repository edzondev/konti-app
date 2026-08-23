import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { AUTH_APP_SCHEME } from "./auth.constants";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
	throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

const client = createAuthClient({
	baseURL,
	plugins: [
		expoClient({
			scheme: AUTH_APP_SCHEME,
			storagePrefix: "konti",
			storage: SecureStore,
		}),
	],
});

export const authClient = client as typeof client & {
	getCookie: () => Promise<string>;
};

export type Session = NonNullable<ReturnType<typeof authClient.useSession>["data"]>;
