import {
	BadRequestException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { and, eq, isNull } from "drizzle-orm";
import { PostHog } from "posthog-node";
import type { Database } from "../database/database.types.js";
import { documents } from "../database/schema/app.schema.js";
import { session, user } from "../database/schema/auth.schema.js";
import { StorageService } from "../storage/storage.service.js";
import { maskIp, parseUserAgent } from "./me.helpers.js";

export type MeExport = {
	exportedAt: string;
	user: { id: string; name: string; email: string; createdAt: string };
	documents: Array<{
		id: string;
		status: string;
		source: string;
		mimeType: string;
		sizeBytes: number;
		sha256: string;
		documentType: string;
		issuerName: string | null;
		issuerTaxId: string | null;
		issueDate: string | null;
		documentNumber: string | null;
		currencyCode: string | null;
		totalAmount: string | null;
		igvAmount: string | null;
		extractionSource: string | null;
		wasUserCorrected: boolean;
		category: string;
		createdAt: string;
		updatedAt: string;
	}>;
};

export type MeSession = {
	id: string;
	createdAt: string;
	expiresAt: string;
	ipMasked: string;
	label: string;
	isCurrent: boolean;
};

@Injectable()
export class MeService {
	private readonly logger = new Logger(MeService.name);

	constructor(
		@InjectDrizzle()
		private readonly db: Database,
		private readonly storage: StorageService,
		private readonly posthog: PostHog,
	) {}

	async exportData(userId: string): Promise<MeExport> {
		const [userRow] = await this.db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				createdAt: user.createdAt,
			})
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!userRow) {
			throw new NotFoundException();
		}

		const docRows = await this.db
			.select({
				id: documents.id,
				status: documents.status,
				source: documents.source,
				mimeType: documents.mimeType,
				sizeBytes: documents.sizeBytes,
				sha256: documents.sha256,
				documentType: documents.documentType,
				issuerName: documents.issuerName,
				issuerTaxId: documents.issuerTaxId,
				issueDate: documents.issueDate,
				documentNumber: documents.documentNumber,
				currencyCode: documents.currencyCode,
				totalAmount: documents.totalAmount,
				igvAmount: documents.igvAmount,
				extractionSource: documents.extractionSource,
				wasUserCorrected: documents.wasUserCorrected,
				category: documents.category,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
			})
			.from(documents)
			.where(and(eq(documents.userId, userId), isNull(documents.deletedAt)));

		return {
			exportedAt: new Date().toISOString(),
			user: {
				id: userRow.id,
				name: userRow.name,
				email: userRow.email,
				createdAt: userRow.createdAt.toISOString(),
			},
			documents: docRows.map((doc) => ({
				id: doc.id,
				status: doc.status,
				source: doc.source,
				mimeType: doc.mimeType,
				sizeBytes: doc.sizeBytes,
				sha256: doc.sha256,
				documentType: doc.documentType,
				issuerName: doc.issuerName,
				issuerTaxId: doc.issuerTaxId,
				issueDate: doc.issueDate,
				documentNumber: doc.documentNumber,
				currencyCode: doc.currencyCode,
				totalAmount: doc.totalAmount,
				igvAmount: doc.igvAmount,
				extractionSource: doc.extractionSource,
				wasUserCorrected: doc.wasUserCorrected,
				category: doc.category,
				createdAt: doc.createdAt.toISOString(),
				updatedAt: doc.updatedAt.toISOString(),
			})),
		};
	}

	async listSessions(userId: string, currentSessionId: string): Promise<MeSession[]> {
		const rows = await this.db
			.select({
				id: session.id,
				createdAt: session.createdAt,
				expiresAt: session.expiresAt,
				ipAddress: session.ipAddress,
				userAgent: session.userAgent,
			})
			.from(session)
			.where(eq(session.userId, userId));

		return rows.map((row) => ({
			id: row.id,
			createdAt: row.createdAt.toISOString(),
			expiresAt: row.expiresAt.toISOString(),
			ipMasked: maskIp(row.ipAddress),
			label: parseUserAgent(row.userAgent).label,
			isCurrent: row.id === currentSessionId,
		}));
	}

	async revokeSession(
		userId: string,
		currentSessionId: string,
		sessionId: string,
	): Promise<void> {
		if (sessionId === currentSessionId) {
			throw new BadRequestException("No puedes revocar la sesión actual");
		}

		const deleted = await this.db
			.delete(session)
			.where(and(eq(session.id, sessionId), eq(session.userId, userId)))
			.returning({ id: session.id });

		if (deleted.length === 0) {
			throw new NotFoundException();
		}
	}

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
