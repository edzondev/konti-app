import { randomUUID } from "node:crypto";
import { HttpStatus } from "@nestjs/common";
import type { ObjectStorage } from "../../core/storage/storage.types";
import type { DocumentStatus, ProcessingStatus } from "../../database/schema/schema.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type {
	DocumentProcessingRepositoryPort,
	ProcessDocumentRow,
	ProcessRunRow,
} from "./document-processing.repository";
import { DocumentProcessingService } from "./document-processing.service";
import { OcrResultInvalidError } from "./mistral-annotation";
import type { OcrExtractResult, OcrProvider } from "./ocr.types";

const profileId = "11111111-1111-4111-8111-111111111111";
const userId = "user-1";
const documentId = "33333333-3333-4333-8333-333333333333";
const FIXED_NOW = new Date("2026-08-20T16:00:00.000Z");
const STALE_AFTER_MS = 120_000;

const readyOcrResult: OcrExtractResult = {
	fields: {
		issuerTaxId: "20100070970",
		issuerName: null,
		issueDate: "2026-08-12",
		documentType: "boleta",
		documentNumber: null,
		currency: null,
		subtotalAmount: null,
		taxAmount: null,
		totalAmount: "148.00",
	},
	pageConfidence: null,
	fieldConfidence: {
		issuerTaxId: null,
		issueDate: null,
		totalAmount: null,
		documentType: null,
	},
	rawPayload: { pagesMarkdown: ["ok"] },
	provider: "fake",
	providerVersion: "1",
};

function storedDocument(status: DocumentStatus): ProcessDocumentRow & {
	issuerTaxId: string | null;
	issueDate: string | null;
	totalAmount: string | null;
	documentType: string;
	processedAt: Date | null;
} {
	return {
		id: documentId,
		taxProfileId: profileId,
		status,
		objectKey: `users/${userId}/tax/2026/documents/${documentId}/original.jpg`,
		mimeType: "image/jpeg",
		deletedAt: null,
		issuerTaxId: null,
		issueDate: null,
		totalAmount: null,
		documentType: "unknown",
		processedAt: null,
	};
}

function createHarness(
	options: { requiresOnboarding?: boolean; extract?: OcrProvider["extract"] } = {},
) {
	const documents = new Map<string, ReturnType<typeof storedDocument>>();
	const runs: Array<
		ProcessRunRow & {
			normalizedResult: Record<string, unknown>;
			fieldConfidence: Record<string, null>;
			rawResultObjectKey: string | null;
			errorCode: string | null;
			finishedAt: Date | null;
			providerVersion: string | null;
		}
	> = [];

	const repository: DocumentProcessingRepositoryPort = {
		async acquireLock({ taxProfileId, documentId: id, now, staleAfterMs, provider }) {
			const document = documents.get(id);
			if (!document || document.taxProfileId !== taxProfileId || document.deletedAt !== null) {
				return { outcome: "not_found" };
			}
			if (document.status === "ready") {
				return { outcome: "already_ready" };
			}
			if (document.status === "needs_review" || document.status === "pending_upload") {
				return { outcome: "not_allowed" };
			}

			const lastExtraction = [...runs]
				.filter((run) => run.documentId === id)
				.sort((left, right) => right.attemptNumber - left.attemptNumber)[0];

			if (document.status === "processing") {
				if (
					lastExtraction?.startedAt &&
					now.getTime() - lastExtraction.startedAt.getTime() <= staleAfterMs
				) {
					return { outcome: "in_progress" };
				}
			}

			if (!["uploaded", "failed", "processing"].includes(document.status)) {
				return { outcome: "not_allowed" };
			}

			document.status = "processing";
			const runFields = {
				attemptNumber: (lastExtraction?.attemptNumber ?? 0) + 1,
				status: "processing" as ProcessingStatus,
				startedAt: now,
				provider,
				pipelineVersion: "extraction-v1",
				normalizedResult: {},
				fieldConfidence: {
					issuerTaxId: null,
					issueDate: null,
					totalAmount: null,
					documentType: null,
				},
				rawResultObjectKey: null,
				errorCode: null,
				finishedAt: null,
				providerVersion: null,
			};

			if (lastExtraction) {
				for (let index = runs.length - 1; index >= 0; index -= 1) {
					const sibling = runs[index];
					if (sibling && sibling.documentId === id && sibling.id !== lastExtraction.id) {
						runs.splice(index, 1);
					}
				}
				Object.assign(lastExtraction, runFields);
				return { outcome: "acquired", document, run: lastExtraction };
			}

			const run = {
				id: randomUUID(),
				documentId: id,
				...runFields,
			};
			runs.push(run);
			return { outcome: "acquired", document, run };
		},
		async completeRun(input) {
			const document = documents.get(input.documentId);
			const run = runs.find((row) => row.id === input.runId);
			if (!document || !run) {
				throw new Error("missing document or run");
			}
			document.status = input.documentStatus;
			document.issuerTaxId = input.extracted.issuerTaxId;
			document.issueDate = input.extracted.issueDate;
			document.totalAmount = input.extracted.totalAmount;
			document.documentType = input.extracted.documentType;
			document.processedAt = input.now;
			run.status = "succeeded";
			run.finishedAt = input.now;
			run.normalizedResult = input.extracted;
			run.fieldConfidence = input.fieldConfidence;
			run.rawResultObjectKey = input.rawResultObjectKey;
			run.provider = input.provider;
			run.providerVersion = input.providerVersion;
		},
		async failRun(input) {
			const document = documents.get(input.documentId);
			const run = runs.find((row) => row.id === input.runId);
			if (!document || !run) {
				throw new Error("missing document or run");
			}
			document.status = "failed";
			run.status = "failed";
			run.finishedAt = input.now;
			run.errorCode = input.errorCode;
		},
	};

	const extract = jest.fn(options.extract ?? (async () => readyOcrResult));
	const ocr = { provider: "fake", extract };
	const storage = {
		createUploadUrl: jest.fn(),
		createDownloadUrl: jest.fn().mockResolvedValue({
			url: "https://storage.example/signed-get",
			expiresAt: "2026-08-20T16:05:00.000Z",
		}),
		headObject: jest.fn(),
		putObject: jest.fn().mockResolvedValue(undefined),
	};
	const taxProfileService = {
		getCurrentUser: jest.fn().mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: options.requiresOnboarding ?? false,
			profile: { id: profileId },
		}),
	};

	return {
		service: new DocumentProcessingService(
			repository,
			storage as jest.Mocked<ObjectStorage>,
			ocr,
			taxProfileService as unknown as TaxProfileService,
			{ now: () => FIXED_NOW, staleAfterMs: STALE_AFTER_MS },
		),
		documents,
		runs,
		ocr,
		storage,
		seed(status: DocumentStatus) {
			const document = storedDocument(status);
			documents.set(document.id, document);
			return document;
		},
	};
}

describe("DocumentProcessingService", () => {
	it("does not call ocr.extract when the document is already ready", async () => {
		const harness = createHarness();
		harness.seed("ready");

		await expect(harness.service.process(userId, documentId)).resolves.toBeUndefined();
		expect(harness.ocr.extract).not.toHaveBeenCalled();
		expect(harness.storage.createDownloadUrl).not.toHaveBeenCalled();
	});

	it("rejects needs_review with PROCESS_NOT_ALLOWED and does not extract", async () => {
		const harness = createHarness();
		harness.seed("needs_review");

		await expect(harness.service.process(userId, documentId)).rejects.toMatchObject({
			response: { code: "PROCESS_NOT_ALLOWED" },
			status: HttpStatus.CONFLICT,
		});
		expect(harness.ocr.extract).not.toHaveBeenCalled();
	});

	it("extracts an uploaded document once and persists ready", async () => {
		const harness = createHarness();
		const document = harness.seed("uploaded");

		await harness.service.process(userId, documentId);

		expect(harness.ocr.extract).toHaveBeenCalledTimes(1);
		expect(harness.ocr.extract).toHaveBeenCalledWith({
			documentId,
			objectKey: document.objectKey,
			mimeType: "image/jpeg",
			imageUrl: "https://storage.example/signed-get",
		});
		expect(harness.storage.createDownloadUrl).toHaveBeenCalledWith({
			objectKey: document.objectKey,
			expiresInSeconds: 300,
		});
		expect(harness.storage.putObject).toHaveBeenCalledWith(
			expect.objectContaining({
				objectKey: `users/${userId}/tax/2026/documents/${documentId}/extraction-v1-1.json`,
				mimeType: "application/json",
			}),
		);
		expect(document.status).toBe("ready");
		expect(document.issuerTaxId).toBe("20100070970");
		expect(document.issueDate).toBe("2026-08-12");
		expect(document.totalAmount).toBe("148.00");
		expect(document.documentType).toBe("receipt");
		expect(harness.runs[0]?.status).toBe("succeeded");
		expect(harness.runs[0]?.provider).toBe("fake");
	});

	it("returns PROCESS_IN_PROGRESS when a second process races a fresh lock", async () => {
		let signalExtractStarted: () => void = () => undefined;
		let finishExtract: (result: OcrExtractResult) => void = () => undefined;
		const extractStarted = new Promise<void>((resolve) => {
			signalExtractStarted = resolve;
		});
		const harness = createHarness({
			extract: async () => {
				signalExtractStarted();
				return await new Promise<OcrExtractResult>((resolve) => {
					finishExtract = resolve;
				});
			},
		});
		harness.seed("uploaded");

		const first = harness.service.process(userId, documentId);
		await extractStarted;

		await expect(harness.service.process(userId, documentId)).rejects.toMatchObject({
			response: { code: "PROCESS_IN_PROGRESS" },
			status: HttpStatus.CONFLICT,
		});
		expect(harness.ocr.extract).toHaveBeenCalledTimes(1);
		finishExtract(readyOcrResult);
		await first;
	});

	it("steals a stale processing lock and extracts again", async () => {
		const harness = createHarness();
		harness.seed("processing");
		harness.runs.push({
			id: randomUUID(),
			documentId,
			attemptNumber: 1,
			status: "processing",
			startedAt: new Date(FIXED_NOW.getTime() - 3 * 60 * 1000),
			provider: "fake",
			pipelineVersion: "extraction-v1",
			normalizedResult: {},
			fieldConfidence: {
				issuerTaxId: null,
				issueDate: null,
				totalAmount: null,
				documentType: null,
			},
			rawResultObjectKey: null,
			errorCode: null,
			finishedAt: null,
			providerVersion: "1",
		});

		await harness.service.process(userId, documentId);

		expect(harness.ocr.extract).toHaveBeenCalledTimes(1);
		expect(harness.runs).toHaveLength(1);
		expect(harness.runs[0]?.attemptNumber).toBe(2);
		expect(harness.runs[0]?.status).toBe("succeeded");
		expect(harness.documents.get(documentId)?.status).toBe("ready");
	});

	it("reuses the same extraction run when retrying a failed document", async () => {
		const harness = createHarness({
			extract: async () => {
				throw new Error("provider down");
			},
		});
		harness.seed("uploaded");

		await harness.service.process(userId, documentId);

		const runId = harness.runs[0]?.id;
		expect(harness.runs).toHaveLength(1);
		expect(harness.runs[0]?.status).toBe("failed");
		expect(harness.runs[0]?.attemptNumber).toBe(1);
		expect(harness.runs[0]?.provider).toBe("fake");

		harness.ocr.extract.mockResolvedValueOnce(readyOcrResult);
		await harness.service.process(userId, documentId);

		expect(harness.runs).toHaveLength(1);
		expect(harness.runs[0]?.id).toBe(runId);
		expect(harness.runs[0]?.attemptNumber).toBe(2);
		expect(harness.runs[0]?.status).toBe("succeeded");
		expect(harness.documents.get(documentId)?.status).toBe("ready");
	});

	it("marks the document and run failed when extract throws", async () => {
		const harness = createHarness({
			extract: async () => {
				throw new Error("provider down");
			},
		});
		harness.seed("uploaded");

		await expect(harness.service.process(userId, documentId)).resolves.toBeUndefined();
		expect(harness.documents.get(documentId)?.status).toBe("failed");
		expect(harness.runs).toHaveLength(1);
		expect(harness.runs[0]?.status).toBe("failed");
		expect(harness.runs[0]?.errorCode).toBe("OCR_PROVIDER_UNAVAILABLE");
		expect(harness.runs[0]?.provider).toBe("fake");
	});

	it("maps OcrResultInvalidError to OCR_RESULT_INVALID", async () => {
		const harness = createHarness({
			extract: async () => {
				throw new OcrResultInvalidError();
			},
		});
		harness.seed("uploaded");

		await harness.service.process(userId, documentId);
		expect(harness.runs[0]?.errorCode).toBe("OCR_RESULT_INVALID");
		expect(harness.documents.get(documentId)?.status).toBe("failed");
	});
});
