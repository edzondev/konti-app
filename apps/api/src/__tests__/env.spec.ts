import { describe, expect, it } from "vitest";
import { validateEnv } from "../config/env.js";

const base = {
	DATABASE_URL: "postgres://u:p@localhost:5432/db",
	BETTER_AUTH_SECRET: "x".repeat(32),
	BETTER_AUTH_URL: "http://localhost:3000",
	GOOGLE_WEB_CLIENT_ID: "web.apps.googleusercontent.com",
	GOOGLE_CLIENT_SECRET: "secret",
	GOOGLE_ANDROID_CLIENT_ID: "android.apps.googleusercontent.com",
	R2_ACCOUNT_ID: "a",
	R2_ACCESS_KEY_ID: "b",
	R2_SECRET_ACCESS_KEY: "c",
	R2_BUCKET_NAME: "bucket",
	MISTRAL_API_KEY: "m",
	POSTHOG_API_KEY: "p",
};

describe("validateEnv google clients", () => {
	it("requires GOOGLE_ANDROID_CLIENT_ID", () => {
		const { GOOGLE_ANDROID_CLIENT_ID: _, ...rest } = base;
		expect(() => validateEnv(rest)).toThrow(/GOOGLE_ANDROID_CLIENT_ID/);
	});

	it("allows missing GOOGLE_IOS_CLIENT_ID", () => {
		const env = validateEnv(base);
		expect(env.GOOGLE_ANDROID_CLIENT_ID).toBe(base.GOOGLE_ANDROID_CLIENT_ID);
		expect(env.GOOGLE_IOS_CLIENT_ID).toBeUndefined();
	});
});
