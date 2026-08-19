import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { buildDocumentObjectKey } from "../../core/storage/object-key";
import { OBJECT_STORAGE } from "../../core/storage/storage.constants";
import type { ObjectStorage } from "../../core/storage/storage.types";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { DocumentsRepository } from "./documents.repository";
import type {
	CreateUploadResult,
	DocumentRecord,
	DocumentsRepositoryPort,
} from "./documents.types";
import type { CreateUploadInput } from "./documents.validation";

const UPLOAD_URL_TTL_SECONDS = 300;
const IDEMPOTENCY_KEY_UNIQUE_INDEX = "documents_profile_idempotency_uidx";
const VISIBLE_SHA256_UNIQUE_INDEX = "documents_profile_sha256_visible_uidx";

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
				return this.createUploadResponse(existingRequest);
			}

			return {
				duplicate: true,
				document: { id: existingRequest.id, status: existingRequest.status },
			};
		}

		const duplicate = await this.repository.findVisibleBySha256(current.profile.id, input.sha256);
		if (duplicate) {
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
			deletedAt: null,
		};

		try {
			await this.repository.insertPending(document);
			return this.createUploadResponse(document);
		} catch (error) {
			if (this.isUniqueViolation(error, IDEMPOTENCY_KEY_UNIQUE_INDEX)) {
				const winningRequest = await this.repository.findByIdempotencyKey(
					current.profile.id,
					input.idempotencyKey,
				);
				if (winningRequest) {
					return this.createExistingRequestResponse(winningRequest);
				}
			}

			if (this.isUniqueViolation(error, VISIBLE_SHA256_UNIQUE_INDEX)) {
				const winningDocument = await this.repository.findVisibleBySha256(
					current.profile.id,
					input.sha256,
				);
				if (winningDocument) {
					return this.duplicateResponse(winningDocument);
				}
			}

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
			throw this.notFound();
		}

		if (document.status === "uploaded") {
			return { id: document.id, status: "uploaded" };
		}

		if (document.status !== "pending_upload") {
			throw this.uploadIncomplete();
		}

		const object = await this.storage.headObject(document.objectKey);
		if (!object.exists) {
			throw this.uploadIncomplete();
		}
		if (object.sizeBytes !== document.sizeBytes) {
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
			throw this.uploadIncomplete();
		}

		return { id: document.id, status: "uploaded" };
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
			throw new HttpException(
				{
					code: "PROFILE_INCOMPLETE",
					message: "Completa tu perfil tributario antes de guardar comprobantes.",
				},
				HttpStatus.CONFLICT,
			);
		}

		return current as typeof current & { profile: NonNullable<typeof current.profile> };
	}

	private uploadIncomplete() {
		return new HttpException(
			{
				code: "UPLOAD_INCOMPLETE",
				message: "El archivo aún no está disponible.",
			},
			HttpStatus.CONFLICT,
		);
	}

	private notFound() {
		return new HttpException(
			{
				code: "DOCUMENT_NOT_FOUND",
				message: "No se encontró el comprobante.",
			},
			HttpStatus.NOT_FOUND,
		);
	}
}
