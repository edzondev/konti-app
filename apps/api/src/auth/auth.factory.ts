import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import type { ConfigService } from "@nestjs/config";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import type { Database } from "../database/database.types";
import * as schema from "../database/schema";
import { AUTH_TRUSTED_ORIGINS } from "./auth.constants";

export function createAuth(db: Database, configService: ConfigService) {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),
		secret: configService.getOrThrow<string>("BETTER_AUTH_SECRET"),
		baseURL: configService.getOrThrow<string>("BETTER_AUTH_URL"),
		plugins: [expo() as BetterAuthPlugin],
		trustedOrigins: [...AUTH_TRUSTED_ORIGINS],
		socialProviders: {
			google: {
				clientId: configService.getOrThrow<string>("GOOGLE_WEB_CLIENT_ID"),
				clientSecret: configService.getOrThrow<string>("GOOGLE_CLIENT_SECRET"),
				prompt: "select_account",
			},
		},
	});
}

export type Auth = ReturnType<typeof createAuth>;
