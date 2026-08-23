import { beforeAll, describe, expect, it, vi } from "vitest";
import appConfig from "../app.json";
import { AUTH_APP_SCHEME } from "./auth.constants";

const authClientFactory = vi.hoisted(() => ({
	create: vi.fn(() => ({ useSession: vi.fn() })),
}));

const expoPlugin = vi.hoisted(() => ({
	create: vi.fn((_options: unknown) => ({ id: "expo" })),
}));

vi.mock("better-auth/react", () => ({
	createAuthClient: authClientFactory.create,
}));

vi.mock("@better-auth/expo/client", () => ({
	expoClient: expoPlugin.create,
}));

vi.mock("expo-secure-store", () => ({
	getItem: vi.fn(),
	getItemAsync: vi.fn(),
	setItem: vi.fn(),
	setItemAsync: vi.fn(),
}));

describe("Expo authentication client configuration", () => {
	beforeAll(async () => {
		vi.stubEnv("EXPO_PUBLIC_API_URL", "http://127.0.0.1:3000");
		await import("./auth-client.js");
	});

	it("uses the custom scheme embedded in the native application", () => {
		const options = expoPlugin.create.mock.calls[0]?.[0] as { scheme?: string } | undefined;

		expect(AUTH_APP_SCHEME).toBe(appConfig.expo.scheme);
		expect(options?.scheme).toBe(AUTH_APP_SCHEME);
	});
});
