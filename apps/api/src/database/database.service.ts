import { Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./database.types";
import * as schema from "./schema";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
	private readonly pool: Pool;
	readonly db: Database;

	constructor(configService: ConfigService) {
		this.pool = new Pool({
			connectionString: configService.getOrThrow("DATABASE_URL"),
		});

		this.db = drizzle({
			client: this.pool,
			schema,
		});
	}

	async onApplicationShutdown() {
		await this.pool.end();
	}
}
