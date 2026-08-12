import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { ConfigService } from "@nestjs/config";
import { betterAuth } from "better-auth";

import type { Database } from "../database/database.types";
import * as schema from "../database/schema";

export function createAuth(db: Database, configService: ConfigService) {
	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
		}),

		secret: configService.getOrThrow<string>("BETTER_AUTH_SECRET"),
		baseURL: configService.getOrThrow<string>("BETTER_AUTH_URL"),
	});
}

export type Auth = ReturnType<typeof createAuth>;
