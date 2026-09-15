import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { InjectDatabase } from "../database/database.decorators.js";
import type { Database } from "../database/database.types.js";

@Controller("health")
export class HealthController {
	constructor(
		@InjectDatabase()
		private readonly db: Database,
	) {}

	@Get()
	async check() {
		try {
			await this.db.execute(sql`select 1`);
			return { status: "ok", database: "up" };
		} catch {
			throw new ServiceUnavailableException("Base de datos no disponible");
		}
	}
}
