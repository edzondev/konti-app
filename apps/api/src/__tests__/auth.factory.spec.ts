import { describe, expect, it, vi } from "vitest";
import { createAuth } from "../auth/auth.factory.js";
import type { Env } from "../config/env.js";
import type { Database } from "../database/database.types.js";

function config(overrides: Partial<Record<keyof Env, string | undefined>> = {}) {
	const values: Record<string, string | undefined> = {
		NODE_ENV: "test",
		BETTER_AUTH_SECRET: "x".repeat(32),
		BETTER_AUTH_URL: "http://localhost:3000",
		GOOGLE_WEB_CLIENT_ID: "web.apps.googleusercontent.com",
		GOOGLE_ANDROID_CLIENT_ID: "android.apps.googleusercontent.com",
		GOOGLE_CLIENT_SECRET: "secret",
		GOOGLE_IOS_CLIENT_ID: undefined,
		...overrides,
	};

	return {
		get: vi.fn((key: string) => values[key]),
		getOrThrow: vi.fn((key: string) => {
			const value = values[key];
			if (value === undefined || value === "") throw new Error(`missing ${key}`);
			return value;
		}),
	};
}

describe("createAuth google clientId", () => {
	it("builds Web+Android array and omits missing iOS", () => {
		const auth = createAuth({} as Database, config() as never);
		const google = (
			auth.options as {
				socialProviders: { google: { clientId: string[] } };
			}
		).socialProviders.google;

		expect(google.clientId).toEqual([
			"web.apps.googleusercontent.com",
			"android.apps.googleusercontent.com",
		]);
	});

	it("includes iOS when configured", () => {
		const auth = createAuth(
			{} as Database,
			config({ GOOGLE_IOS_CLIENT_ID: "ios.apps.googleusercontent.com" }) as never,
		);
		const google = (
			auth.options as {
				socialProviders: { google: { clientId: string[] } };
			}
		).socialProviders.google;

		expect(google.clientId).toEqual([
			"web.apps.googleusercontent.com",
			"android.apps.googleusercontent.com",
			"ios.apps.googleusercontent.com",
		]);
	});
});

describe("createAuth emailAndPassword", () => {
	it("disables email and password", () => {
		const auth = createAuth({} as Database, config() as never);
		const emailAndPassword = (
			auth.options as {
				emailAndPassword: { enabled: boolean };
			}
		).emailAndPassword;

		expect(emailAndPassword.enabled).toBe(false);
	});
});
