import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getDrizzleToken } from "@nestjs/drizzle";
import { PostHog } from "posthog-node";
import type { Env } from "../config/env.js";
import type { Database } from "../database/database.types.js";
import { AUTH } from "./auth.constants.js";
import { createAuth } from "./auth.factory.js";
import { AuthGuard } from "./auth.guard.js";

@Global()
@Module({
	providers: [
		AuthGuard,
		{
			provide: AUTH,
			useFactory: (db: Database, configService: ConfigService<Env, true>, posthog: PostHog) =>
				createAuth(db, configService, posthog),
			inject: [getDrizzleToken(), ConfigService, PostHog],
		},
	],
	exports: [AUTH, AuthGuard],
	controllers: [],
})
export class AuthModule {}
