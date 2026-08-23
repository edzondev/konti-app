import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mockBetterAuth = jest.fn();
const mockDrizzleAdapter = jest.fn((_database: unknown, _options: unknown) => ({
	id: "drizzle-adapter",
}));
const mockExpo = jest.fn(() => ({ id: "expo" }));

jest.mock("better-auth", () => ({
	betterAuth: (options: unknown) => mockBetterAuth(options),
}));
jest.mock("@better-auth/drizzle-adapter", () => ({
	drizzleAdapter: (database: unknown, options: unknown) => mockDrizzleAdapter(database, options),
}));
jest.mock("@better-auth/expo", () => ({
	expo: () => mockExpo(),
}));

import { createAuth } from "./auth.factory";

const mobileAppConfig = JSON.parse(
	readFileSync(resolve(__dirname, "../../../mobile/app.json"), "utf8"),
) as {
	expo: { scheme: string };
};

describe("createAuth", () => {
	it("always asks Google to select an account without requesting extra consent or offline access", () => {
		const values: Record<string, string> = {
			BETTER_AUTH_SECRET: "test-secret-at-least-32-characters",
			BETTER_AUTH_URL: "http://localhost:3000",
			GOOGLE_WEB_CLIENT_ID: "google-client-id",
			GOOGLE_CLIENT_SECRET: "google-client-secret",
		};
		const configService = {
			getOrThrow: (key: string) => values[key],
		};

		createAuth({} as never, configService as never);

		const options = mockBetterAuth.mock.calls[0]?.[0] as {
			socialProviders: {
				google: Record<string, unknown>;
			};
		};
		const google = options.socialProviders.google;

		expect(google).toMatchObject({
			clientId: "google-client-id",
			clientSecret: "google-client-secret",
			prompt: "select_account",
		});
		expect(google).not.toHaveProperty("accessType");
		expect(google.prompt).not.toContain("consent");
	});

	it("trusts the custom scheme embedded in the Expo application", () => {
		const values: Record<string, string> = {
			BETTER_AUTH_SECRET: "test-secret-at-least-32-characters",
			BETTER_AUTH_URL: "http://localhost:3000",
			GOOGLE_WEB_CLIENT_ID: "google-client-id",
			GOOGLE_CLIENT_SECRET: "google-client-secret",
		};
		const configService = {
			getOrThrow: (key: string) => values[key],
		};

		createAuth({} as never, configService as never);

		const options = mockBetterAuth.mock.calls.at(-1)?.[0] as {
			trustedOrigins: string[];
		};
		const scheme = mobileAppConfig.expo.scheme;

		expect(options.trustedOrigins).toEqual([`${scheme}://`, `${scheme}://*`]);
	});
});
