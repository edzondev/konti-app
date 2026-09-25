import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import type { ConfigService } from "@nestjs/config";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import type { Env } from "../config/env.js";
import type { Database } from "../database/database.types.js";
import * as schema from "../database/schema/index.js";
import { AUTH_TRUSTED_ORIGINS } from "./auth.constants.js";

export function createAuth(db: Database, configService: ConfigService<Env, true>) {
	const isProd = configService.get("NODE_ENV") === "production";

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		secret: configService.getOrThrow("BETTER_AUTH_SECRET"),
		baseURL: configService.getOrThrow("BETTER_AUTH_URL"),
		emailAndPassword: {
			enabled: false,
		},
		plugins: [expo() as BetterAuthPlugin],
		trustedOrigins: [...AUTH_TRUSTED_ORIGINS],
		advanced: {
			useSecureCookies: isProd,
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: "lax",
				secure: isProd,
			},
		},
		socialProviders: {
			google: {
				clientId: [
					configService.getOrThrow("GOOGLE_WEB_CLIENT_ID"),
					configService.getOrThrow("GOOGLE_ANDROID_CLIENT_ID"),
					configService.get("GOOGLE_IOS_CLIENT_ID"),
				].filter((id): id is string => Boolean(id)),
				clientSecret: configService.getOrThrow("GOOGLE_CLIENT_SECRET"),
				prompt: "select_account",
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
