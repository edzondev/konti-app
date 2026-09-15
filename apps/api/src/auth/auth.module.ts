import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.js";
import { DATABASE } from "../database/database.constants.js";
import { DatabaseModule } from "../database/database.module.js";
import type { Database } from "../database/database.types.js";
import { AUTH } from "./auth.constants.js";
import { createAuth } from "./auth.factory.js";
import { AuthGuard } from "./auth.guard.js";

@Global()
@Module({
	imports: [DatabaseModule],
	providers: [
		AuthGuard,
		{
			provide: AUTH,
			useFactory: (db: Database, configService: ConfigService<Env, true>) =>
				createAuth(db, configService),
			inject: [DATABASE, ConfigService],
		},
	],
	exports: [AUTH, AuthGuard],
	controllers: [],
})
export class AuthModule {}
