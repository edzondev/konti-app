import { Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DrizzleModule } from "@nestjs/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Env } from "../config/env.js";
import * as schema from "./schema/index.js";

const logger = new Logger("DatabaseModule");

@Module({
	imports: [
		DrizzleModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService<Env, true>) => {
				const pool = new Pool({
					connectionString: configService.getOrThrow("DATABASE_URL"),
					connectionTimeoutMillis: configService.get("DATABASE_CONNECTION_TIMEOUT_MS"),
					idleTimeoutMillis: configService.get("DATABASE_IDLE_TIMEOUT_MS"),
					max: configService.get("DATABASE_POOL_MAX"),
				});

				// Un error del pool no debe tumbar el proceso en silencio.
				pool.on("error", (error) => {
					logger.error("Error inesperado en el pool de Postgres", error.stack);
				});

				return {
					db: drizzle({ client: pool, schema }),
				};
			},
		}),
	],
})
export class DatabaseModule {}
