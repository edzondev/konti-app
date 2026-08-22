import { HttpException, HttpStatus, Inject, Injectable, Optional } from "@nestjs/common";
import { createDevLogger } from "../../core/dev-logger";
import { buildExtractionRawObjectKey } from "../../core/storage/object-key";
import { OBJECT_STORAGE } from "../../core/storage/storage.constants";
import type { ObjectStorage } from "../../core/storage/storage.types";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import {
	DocumentProcessingRepository,
	type DocumentProcessingRepositoryPort,
	type ProcessRunRow,
} from "./document-processing.repository";
import { normalizeExtraction, validateExtraction } from "./extraction";
import { OcrResultInvalidError } from "./mistral-annotation";
import { OCR_PROVIDER } from "./ocr.constants";
import type { OcrProvider } from "./ocr.types";

const logger = createDevLogger("document-processing.service");

const DOWNLOAD_URL_TTL_SECONDS = 300;
const DEFAULT_STALE_AFTER_MS = 120_000;

export const DOCUMENT_PROCESSING_CLOCK = "DOCUMENT_PROCESSING_CLOCK";

export type DocumentProcessingClock = {
	now: () => Date;
	staleAfterMs?: number;
};

@Injectable()
export class DocumentProcessingService {
	constructor(
		@Inject(DocumentProcessingRepository)
		private readonly repository: DocumentProcessingRepositoryPort,
		@Inject(OBJECT_STORAGE)
		private readonly storage: ObjectStorage,
		@Inject(OCR_PROVIDER)
		private readonly ocr: OcrProvider,
		@Inject(TaxProfileService)
		private readonly taxProfileService: TaxProfileService,
		@Optional()
		@Inject(DOCUMENT_PROCESSING_CLOCK)
		private readonly clock?: DocumentProcessingClock,
	) {}

	async process(userId: string, documentId: string): Promise<void> {
		const current = await this.getCompleteProfile(userId);
		const now = this.clock?.now() ?? new Date();
		const staleAfterMs = this.clock?.staleAfterMs ?? DEFAULT_STALE_AFTER_MS;
		const lock = await this.repository.acquireLock({
			taxProfileId: current.profile.id,
			documentId,
			provider: this.ocr.provider,
			now,
			staleAfterMs,
		});

		if (lock.outcome === "not_found") {
			throw this.notFound({ userId, documentId });
		}
		if (lock.outcome === "already_ready") {
			logger.info("process:already_ready", { userId, documentId });
			return;
		}
		if (lock.outcome === "not_allowed") {
			throw this.processNotAllowed({ userId, documentId });
		}
		if (lock.outcome === "in_progress") {
			throw this.processInProgress({ userId, documentId });
		}

		await this.extractAndPersist({
			userId,
			taxProfileId: current.profile.id,
			createFourthIncomeAttention: current.profile.incomeMode === "independent",
			taxYear: current.taxYear,
			documentId: lock.document.id,
			objectKey: lock.document.objectKey,
			mimeType: lock.document.mimeType,
			run: lock.run,
		});
	}

	private async extractAndPersist(input: {
		userId: string;
		taxProfileId: string;
		createFourthIncomeAttention: boolean;
		taxYear: number;
		documentId: string;
		objectKey: string;
		mimeType: "image/jpeg" | "image/png";
		run: ProcessRunRow;
	}): Promise<void> {
		try {
			const download = await this.storage.createDownloadUrl({
				objectKey: input.objectKey,
				expiresInSeconds: DOWNLOAD_URL_TTL_SECONDS,
			});
			const extracted = await this.ocr.extract({
				documentId: input.documentId,
				objectKey: input.objectKey,
				mimeType: input.mimeType,
				imageUrl: download.url,
			});
			const normalized = normalizeExtraction(extracted.fields);
			const decision = validateExtraction(normalized);
			const rawResultObjectKey = buildExtractionRawObjectKey({
				userId: input.userId,
				taxYear: input.taxYear,
				documentId: input.documentId,
				attemptNumber: input.run.attemptNumber,
			});

			await this.storage.putObject({
				objectKey: rawResultObjectKey,
				body: Buffer.from(JSON.stringify(extracted.rawPayload)),
				mimeType: "application/json",
			});

			await this.repository.completeRun({
				taxProfileId: input.taxProfileId,
				createFourthIncomeAttention: input.createFourthIncomeAttention,
				documentId: input.documentId,
				runId: input.run.id,
				documentStatus: decision.status,
				extracted: normalized,
				fieldConfidence: decision.fieldConfidence,
				doubtfulFields: decision.doubtfulFields,
				attemptNumber: input.run.attemptNumber,
				rawResultObjectKey,
				provider: extracted.provider,
				providerVersion: extracted.providerVersion,
				now: this.clock?.now() ?? new Date(),
			});
			logger.info("process:completed", {
				userId: input.userId,
				documentId: input.documentId,
				status: decision.status,
				attemptNumber: input.run.attemptNumber,
			});
		} catch (error) {
			const errorCode =
				error instanceof OcrResultInvalidError ? "OCR_RESULT_INVALID" : "OCR_PROVIDER_UNAVAILABLE";
			logger.error("process:extract_failed", {
				userId: input.userId,
				documentId: input.documentId,
				errorCode,
				errorName: error instanceof Error ? error.name : undefined,
				statusCode:
					typeof error === "object" &&
					error !== null &&
					"statusCode" in error &&
					typeof error.statusCode === "number"
						? error.statusCode
						: undefined,
			});
			await this.repository.failRun({
				documentId: input.documentId,
				runId: input.run.id,
				errorCode,
				now: this.clock?.now() ?? new Date(),
			});
		}
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

	private processNotAllowed(meta?: Record<string, unknown>) {
		const message = "Este comprobante no se puede procesar ahora.";
		logger.warn("process:not_allowed", {
			...meta,
			status: HttpStatus.CONFLICT,
			message,
		});
		return new HttpException(
			{
				code: "PROCESS_NOT_ALLOWED",
				message,
			},
			HttpStatus.CONFLICT,
		);
	}

	private processInProgress(meta?: Record<string, unknown>) {
		const message = "El comprobante se está procesando.";
		logger.warn("process:in_progress", {
			...meta,
			status: HttpStatus.CONFLICT,
			message,
		});
		return new HttpException(
			{
				code: "PROCESS_IN_PROGRESS",
				message,
			},
			HttpStatus.CONFLICT,
		);
	}

	private notFound(meta?: Record<string, unknown>) {
		const message = "No se encontró el comprobante.";
		logger.warn("process:not_found", {
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
