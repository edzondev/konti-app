import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Database } from "./database.types.js";
import * as schema from "./schema/index.js";

@Injectable()
export class DatabaseService {
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
