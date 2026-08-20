import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { createDevLogger } from "../../core/dev-logger";
import { buildDocumentObjectKey } from "../../core/storage/object-key";
import { OBJECT_STORAGE } from "../../core/storage/storage.constants";
import type { ObjectStorage } from "../../core/storage/storage.types";
import type { ProcessingStatus } from "../../database/schema/schema.types";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { decodeDocumentCursor, encodeDocumentCursor } from "./documents.cursor";
import { DocumentsRepository } from "./documents.repository";
import type {
	CreateUploadResult,
	DocumentDetail,
	DocumentListItem,
	DocumentRecord,
	DocumentsRepositoryPort,
	DoubtfulField,
} from "./documents.types";
import type { CreateUploadInput } from "./documents.validation";

const logger = createDevLogger("documents.service");

const UPLOAD_URL_TTL_SECONDS = 300;
const DOWNLOAD_URL_TTL_SECONDS = 300;
const DEFAULT_LIST_LIMIT = 30;
const MAX_LIST_LIMIT = 50;
const IDEMPOTENCY_KEY_UNIQUE_INDEX = "documents_profile_idempotency_uidx";
const VISIBLE_SHA256_UNIQUE_INDEX = "documents_profile_sha256_visible_uidx";
const DOUBTFUL_FIELDS: readonly DoubtfulField[] = [
	"issuerTaxId",
	"issueDate",
	"totalAmount",
	"documentType",
];

@Injectable()
export class DocumentsService {
	constructor(
		@Inject(DocumentsRepository)
		private readonly repository: DocumentsRepositoryPort,
		@Inject(OBJECT_STORAGE)
		private readonly storage: ObjectStorage,
		@Inject(TaxProfileService)
		private readonly taxProfileService: TaxProfileService,
	) {}

	async createUpload(userId: string, input: CreateUploadInput): Promise<CreateUploadResult> {
		const current = await this.getCompleteProfile(userId);
		const existingRequest = await this.repository.findByIdempotencyKey(
			current.profile.id,
			input.idempotencyKey,
		);

		if (existingRequest) {
			if (existingRequest.status === "pending_upload") {
				logger.info("createUpload:idempotent_hit_pending", {
					userId,
					documentId: existingRequest.id,
				});
				return this.createUploadResponse(existingRequest);
			}

			logger.info("createUpload:idempotent_hit_duplicate", {
				userId,
				documentId: existingRequest.id,
			});
			return {
				duplicate: true,
				document: { id: existingRequest.id, status: existingRequest.status },
			};
		}

		const duplicate = await this.repository.findVisibleBySha256(current.profile.id, input.sha256);
		if (duplicate) {
			logger.info("createUpload:sha256_duplicate", { userId, documentId: duplicate.id });
			return {
				duplicate: true,
				document: { id: duplicate.id, status: duplicate.status },
			};
		}

		const id = randomUUID();
		const document: DocumentRecord = {
			id,
			taxProfileId: current.profile.id,
			status: "pending_upload",
			idempotencyKey: input.idempotencyKey,
			objectKey: buildDocumentObjectKey({
				userId,
				taxYear: current.taxYear,
				documentId: id,
				mimeType: input.mimeType,
			}),
			originalFileName: input.originalFileName,
			mimeType: input.mimeType,
			sizeBytes: input.sizeBytes,
			sha256: input.sha256,
			pageCount: input.pageCount,
			source: input.source,
			documentType: "unknown",
			issuerName: null,
			issuerTaxId: null,
			documentNumber: null,
			totalAmount: null,
			subtotalAmount: null,
			taxAmount: null,
			currencyCode: null,
			issueDate: null,
			metadata: {},
			deletedAt: null,
			createdAt: new Date(),
		};

		try {
			await this.repository.insertPending(document);
			logger.info("createUpload:new_document", { userId, documentId: id });
			return this.createUploadResponse(document);
		} catch (error) {
			if (this.isUniqueViolation(error, IDEMPOTENCY_KEY_UNIQUE_INDEX)) {
				const winningRequest = await this.repository.findByIdempotencyKey(
					current.profile.id,
					input.idempotencyKey,
				);
				if (winningRequest) {
					logger.info("createUpload:idempotency_race_resolved", {
						userId,
						documentId: winningRequest.id,
					});
					return this.createExistingRequestResponse(winningRequest);
				}
			}

			if (this.isUniqueViolation(error, VISIBLE_SHA256_UNIQUE_INDEX)) {
				const winningDocument = await this.repository.findVisibleBySha256(
					current.profile.id,
					input.sha256,
				);
				if (winningDocument) {
					logger.info("createUpload:sha256_race_resolved", {
						userId,
						documentId: winningDocument.id,
					});
					return this.duplicateResponse(winningDocument);
				}
			}

			logger.error("createUpload:insert_failed", {
				userId,
				message: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	async completeUpload(
		userId: string,
		documentId: string,
	): Promise<{ id: string; status: "uploaded" }> {
		const current = await this.getCompleteProfile(userId);
		const document = await this.repository.getOwned(current.profile.id, documentId);
		if (!document) {
			throw this.notFound({ userId, documentId });
		}

		if (document.status === "uploaded") {
			return { id: document.id, status: "uploaded" };
		}

		if (document.status !== "pending_upload") {
			throw this.uploadIncomplete({
				userId,
				documentId,
				reason: "invalid_status",
				status: document.status,
			});
		}

		const object = await this.storage.headObject(document.objectKey);
		if (!object.exists) {
			throw this.uploadIncomplete({ userId, documentId, reason: "head_object_missing" });
		}
		logger.info("completeUpload:head_object_found", {
			userId,
			documentId,
			sizeBytes: object.sizeBytes,
		});
		if (object.sizeBytes !== document.sizeBytes) {
			logger.warn("completeUpload:size_mismatch", {
				userId,
				documentId,
				expectedSizeBytes: document.sizeBytes,
				actualSizeBytes: object.sizeBytes,
			});
			throw new HttpException(
				{
					code: "UPLOAD_SIZE_MISMATCH",
					message: "El archivo subido no coincide con el tamaño declarado.",
				},
				HttpStatus.CONFLICT,
			);
		}

		const updated = await this.repository.updateStatus(document.id, "pending_upload", "uploaded");
		if (!updated) {
			const latest = await this.repository.getOwned(current.profile.id, document.id);
			if (latest?.status === "uploaded") {
				return { id: latest.id, status: "uploaded" };
			}
			throw this.uploadIncomplete({ userId, documentId, reason: "status_update_failed" });
		}

		logger.info("completeUpload:status_updated", { userId, documentId, status: "uploaded" });
		return { id: document.id, status: "uploaded" };
	}

	async countVisible(userId: string): Promise<number> {
		const current = await this.getCompleteProfile(userId);
		return this.repository.countVisible(current.profile.id);
	}

	async list(
		userId: string,
		query: { cursor?: string; limit?: number },
	): Promise<{ items: DocumentListItem[]; nextCursor: string | null }> {
		const current = await this.getCompleteProfile(userId);
		const limit = Math.min(Math.max(query.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);
		const decodedCursor = query.cursor ? decodeDocumentCursor(query.cursor) : undefined;
		const cursorDocument = decodedCursor
			? await this.repository.getOwned(current.profile.id, decodedCursor.id)
			: undefined;
		if (decodedCursor && !cursorDocument) {
			throw new Error("Invalid document cursor");
		}
		const documents = await this.repository.listVisible(current.profile.id, {
			cursor: cursorDocument && { createdAt: cursorDocument.createdAt, id: cursorDocument.id },
			limit,
		});
		const hasMore = documents.length > limit;
		const page = documents.slice(0, limit);
		const items = await Promise.all(page.map((document) => this.toListItem(document)));
		const last = page.at(-1);

		return {
			items,
			nextCursor:
				hasMore && last
					? encodeDocumentCursor({ createdAt: last.createdAt.toISOString(), id: last.id })
					: null,
		};
	}

	async getOne(userId: string, documentId: string): Promise<DocumentDetail> {
		const document = await this.getVisibleOwnedDocument(userId, documentId);

		return {
			document: this.toPublicFields(document),
			processing: this.toProcessing(document),
			attention: null,
		};
	}

	async createFileUrl(
		userId: string,
		documentId: string,
	): Promise<{ url: string; expiresAt: string }> {
		const document = await this.getVisibleOwnedDocument(userId, documentId);
		return this.storage.createDownloadUrl({
			objectKey: document.objectKey,
			expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
		});
	}

	private async createUploadResponse(document: DocumentRecord): Promise<CreateUploadResult> {
		const upload = await this.storage.createUploadUrl({
			objectKey: document.objectKey,
			mimeType: document.mimeType,
			expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
		});

		return {
			duplicate: false,
			document: { id: document.id, status: "pending_upload" },
			upload: { ...upload, method: "PUT" },
		};
	}

	private createExistingRequestResponse(document: DocumentRecord): Promise<CreateUploadResult> {
		if (document.status === "pending_upload") {
			return this.createUploadResponse(document);
		}

		return Promise.resolve(this.duplicateResponse(document));
	}

	private duplicateResponse(document: DocumentRecord): CreateUploadResult {
		return {
			duplicate: true,
			document: { id: document.id, status: document.status },
		};
	}

	private isUniqueViolation(error: unknown, constraint: string): boolean {
		return (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			"constraint" in error &&
			error.code === "23505" &&
			error.constraint === constraint
		);
	}

	private async getCompleteProfile(userId: string) {
		const current = await this.taxProfileService.getCurrentUser(userId);
		if (current.requiresOnboarding || !current.profile) {
			const message = "Completa tu perfil tributario antes de guardar comprobantes.";
			logger.warn("getCompleteProfile:profile_incomplete", {
				userId,
				status: HttpStatus.CONFLICT,
				message,
			});
			throw new HttpException(
				{
					code: "PROFILE_INCOMPLETE",
					message,
				},
				HttpStatus.CONFLICT,
			);
		}

		return current as typeof current & { profile: NonNullable<typeof current.profile> };
	}

	private async getVisibleOwnedDocument(
		userId: string,
		documentId: string,
	): Promise<DocumentRecord> {
		const current = await this.getCompleteProfile(userId);
		const document = await this.repository.getOwned(current.profile.id, documentId);
		if (!document || document.status === "pending_upload" || document.deletedAt !== null) {
			throw this.notFound({ userId, documentId });
		}

		return document;
	}

	private async toListItem(document: DocumentRecord): Promise<DocumentListItem> {
		const preview = await this.storage.createDownloadUrl({
			objectKey: document.objectKey,
			expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
		});

		return {
			...this.toPublicFields(document),
			previewUrl: preview.url,
			previewExpiresAt: preview.expiresAt,
		};
	}

	private toPublicFields(
		document: DocumentRecord,
	): Omit<DocumentListItem, "previewUrl" | "previewExpiresAt"> {
		return {
			id: document.id,
			status: document.status,
			source: document.source,
			createdAt: document.createdAt.toISOString(),
			originalFileName: document.originalFileName,
			mimeType: document.mimeType,
			issuerName: document.issuerName,
			issuerTaxId: document.issuerTaxId,
			documentNumber: document.documentNumber,
			totalAmount: document.totalAmount,
			subtotalAmount: document.subtotalAmount,
			taxAmount: document.taxAmount,
			currencyCode: document.currencyCode,
			documentType: document.documentType,
			issueDate: document.issueDate,
			doubtfulFields: this.readDoubtfulFields(document.metadata),
		};
	}

	private toProcessing(document: DocumentRecord): DocumentDetail["processing"] {
		if (document.status === "uploaded") {
			return null;
		}

		const metadata = document.metadata ?? {};
		return {
			status: this.toRunStatus(document.status),
			attemptNumber: typeof metadata.attemptNumber === "number" ? metadata.attemptNumber : 1,
			doubtfulFields: this.readDoubtfulFields(metadata),
		};
	}

	private readDoubtfulFields(source: Record<string, unknown> | undefined): DoubtfulField[] {
		const raw = source?.doubtfulFields;
		if (!Array.isArray(raw)) {
			return [];
		}

		return raw.filter(
			(value): value is DoubtfulField =>
				typeof value === "string" && DOUBTFUL_FIELDS.includes(value as DoubtfulField),
		);
	}

	private toRunStatus(status: DocumentRecord["status"]): ProcessingStatus {
		if (status === "failed") {
			return "failed";
		}
		if (status === "processing" || status === "queued") {
			return "processing";
		}
		return "succeeded";
	}

	private uploadIncomplete(meta?: Record<string, unknown>) {
		const message = "El archivo aún no está disponible.";
		logger.warn("completeUpload:upload_incomplete", {
			...meta,
			status: HttpStatus.CONFLICT,
			message,
		});
		return new HttpException(
			{
				code: "UPLOAD_INCOMPLETE",
				message,
			},
			HttpStatus.CONFLICT,
		);
	}

	private notFound(meta?: Record<string, unknown>) {
		const message = "No se encontró el comprobante.";
		logger.warn("documents:not_found", {
			...meta,
			status: HttpStatus.NOT_FOUND,
			message,
		});
		return new HttpException(
			{
				code: "DOCUMENT_NOT_FOUND",
				message,
			},
			HttpStatus.NOT_FOUND,
		);
	}
}
