import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { PostHog } from "posthog-node";
import { InjectDatabase } from "../database/database.decorators.js";
import type { Database } from "../database/database.types.js";
import { documents } from "../database/schema/app.schema.js";
import { user } from "../database/schema/auth.schema.js";
import { StorageService } from "../storage/storage.service.js";

@Injectable()
export class MeService {
	private readonly logger = new Logger(MeService.name);

	constructor(
		@InjectDatabase()
		private readonly db: Database,
		private readonly storage: StorageService,
		private readonly posthog: PostHog,
	) {}

	async deleteAccount(userId: string): Promise<void> {
		// 0. Analytics antes de borrar (sin props ni user_id). Flush para no perder el evento.
		this.posthog.capture({ event: "user_deleted" });
		await this.posthog.flush();

		// 1. Leer objectKeys ANTES de borrar el user.
		//    Después del delete, las filas ya no existirán.
		const rows = await this.db
			.select({ objectKey: documents.objectKey })
			.from(documents)
			.where(eq(documents.userId, userId));

		const objectKeys = rows.map((row) => row.objectKey);

		// 2. Borrar user (cascade limpia documents, session, account).
		await this.db.delete(user).where(eq(user.id, userId));

		// 3. Borrar objetos de R2 en paralelo. Fallos se loguean; no rompen el endpoint.
		const results = await Promise.allSettled(
			objectKeys.map((objectKey) => this.storage.delete(objectKey)),
		);

		for (const [index, result] of results.entries()) {
			if (result.status === "rejected") {
				const objectKey = objectKeys[index];
				const reason = result.reason;
				this.logger.error(
					`No se pudo eliminar el objeto ${objectKey} de R2`,
					reason instanceof Error ? reason.stack : undefined,
				);
			}
		}

		// 4. Loguear éxito de borrado de cuenta.
		this.logger.log(`account deleted for user ${userId}`);
	}
}
