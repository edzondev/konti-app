import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import type { ConfigService } from "@nestjs/config";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import type { Env } from "../config/env.js";
import type { Database } from "../database/database.types.js";
import * as schema from "../database/schema/index.js";
import { AUTH_TRUSTED_ORIGINS } from "./auth.constants.js";

export function createAuth(db: Database, configService: ConfigService<Env, true>) {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		secret: configService.getOrThrow("BETTER_AUTH_SECRET"),
		baseURL: configService.getOrThrow("BETTER_AUTH_URL"),
		emailAndPassword: {
			enabled: true,
		},
		plugins: [expo() as BetterAuthPlugin],
		trustedOrigins: [...AUTH_TRUSTED_ORIGINS],
		socialProviders: {
			google: {
				clientId: configService.getOrThrow("GOOGLE_WEB_CLIENT_ID"),
				clientSecret: configService.getOrThrow("GOOGLE_CLIENT_SECRET"),
				prompt: "select_account",
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
