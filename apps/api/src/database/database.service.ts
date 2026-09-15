import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Env } from "../config/env.js";
import type { Database } from "./database.types.js";
import * as schema from "./schema/index.js";

@Injectable()
export class DatabaseService {
	private readonly logger = new Logger(DatabaseService.name);
	private readonly pool: Pool;
	readonly db: Database;

	constructor(configService: ConfigService<Env, true>) {
		this.pool = new Pool({
			connectionString: configService.getOrThrow("DATABASE_URL"),
			connectionTimeoutMillis: configService.get("DATABASE_CONNECTION_TIMEOUT_MS"),
			idleTimeoutMillis: configService.get("DATABASE_IDLE_TIMEOUT_MS"),
			max: configService.get("DATABASE_POOL_MAX"),
		});

		// Un error del pool no debe tumbar el proceso en silencio.
		this.pool.on("error", (error) => {
			this.logger.error("Error inesperado en el pool de Postgres", error.stack);
		});

		this.db = drizzle({ client: this.pool, schema });
	}

	async onApplicationShutdown(): Promise<void> {
		await this.pool.end();
	}
}
