import { Controller, Get, Logger, ServiceUnavailableException } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { sql } from "drizzle-orm";
import type { Database } from "../database/database.types.js";

@Controller("health")
export class HealthController {
	private readonly logger = new Logger(HealthController.name);

	constructor(
		@InjectDrizzle()
		private readonly db: Database,
	) {}

	@Get()
	async check() {
		try {
			await this.db.execute(sql`select 1`);
			return { status: "ok", database: "up" };
		} catch (error) {
			this.logger.error(
				error instanceof Error ? error.message : error,
				error instanceof Error ? error.stack : undefined,
			);
			throw new ServiceUnavailableException("Base de datos no disponible");
		}
	}
}
