import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import { documents } from "../../database/schema";
import type { Database } from "../../database/database.types";
import type {
	DocumentRecord,
	DocumentsRepositoryPort,
	DocumentUploadStatus,
} from "./documents.types";

@Injectable()
export class DocumentsRepository implements DocumentsRepositoryPort {
	constructor(
		@Inject(DATABASE)
		private readonly db: Database,
	) {}

	async findByIdempotencyKey(taxProfileId: string, key: string): Promise<DocumentRecord | undefined> {
		const [document] = await this.db
			.select()
			.from(documents)
			.where(and(eq(documents.taxProfileId, taxProfileId), eq(documents.idempotencyKey, key)))
			.limit(1);

		return document as DocumentRecord | undefined;
	}

	async findVisibleBySha256(taxProfileId: string, sha256: string): Promise<DocumentRecord | undefined> {
		const [document] = await this.db
			.select()
			.from(documents)
			.where(
				and(
					eq(documents.taxProfileId, taxProfileId),
					eq(documents.sha256, sha256),
					isNull(documents.deletedAt),
				),
			)
			.limit(1);

		return document as DocumentRecord | undefined;
	}

	async insertPending(row: DocumentRecord): Promise<DocumentRecord> {
		const [document] = await this.db.insert(documents).values(row).returning();
		if (!document) {
			throw new Error("Document could not be persisted");
		}

		return document as DocumentRecord;
	}

	async updateStatus(
		id: string,
		fromStatus: DocumentUploadStatus,
		toStatus: DocumentUploadStatus,
	): Promise<boolean> {
		const updated = await this.db
			.update(documents)
			.set({ status: toStatus })
			.where(and(eq(documents.id, id), eq(documents.status, fromStatus)))
			.returning({ id: documents.id });

		return updated.length > 0;
	}

	async getOwned(taxProfileId: string, documentId: string): Promise<DocumentRecord | undefined> {
		const [document] = await this.db
			.select()
			.from(documents)
			.where(and(eq(documents.taxProfileId, taxProfileId), eq(documents.id, documentId)))
			.limit(1);

		return document as DocumentRecord | undefined;
	}

	async listVisible(
		taxProfileId: string,
		query: { cursor?: { createdAt: Date; id: string }; limit: number },
	): Promise<DocumentRecord[]> {
		const cursorCondition = query.cursor
			? or(
					lt(documents.createdAt, query.cursor.createdAt),
					and(eq(documents.createdAt, query.cursor.createdAt), lt(documents.id, query.cursor.id)),
				)
			: undefined;
		const rows = await this.db
			.select()
			.from(documents)
			.where(
				and(
					eq(documents.taxProfileId, taxProfileId),
					eq(documents.status, "uploaded"),
					isNull(documents.deletedAt),
					cursorCondition,
				),
			)
			.orderBy(desc(documents.createdAt), desc(documents.id))
			.limit(query.limit + 1);

		return rows as DocumentRecord[];
	}
}
