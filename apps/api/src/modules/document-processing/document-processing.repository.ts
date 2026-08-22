import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database } from "../../database/database.types";
import { attentionItems, documentProcessingRuns, documents } from "../../database/schema";
import type { DocumentStatus, ProcessingStatus } from "../../database/schema/schema.types";
import { buildFourthIncomeAttention } from "../tax-income/tax-income-candidate";
import type { ExtractionDecision, NormalizedExtraction } from "./extraction";

const PIPELINE_VERSION = "extraction-v2";
const LOCKABLE_STATUSES = [
	"uploaded",
	"failed",
	"processing",
] as const satisfies readonly DocumentStatus[];

export type ProcessDocumentRow = {
	id: string;
	taxProfileId: string;
	status: DocumentStatus;
	objectKey: string;
	mimeType: "image/jpeg" | "image/png";
	deletedAt: Date | null;
};

export type ProcessRunRow = {
	id: string;
	documentId: string;
	attemptNumber: number;
	status: ProcessingStatus;
	startedAt: Date | null;
	provider: string;
	pipelineVersion: string | null;
};

export type AcquireProcessLockInput = {
	taxProfileId: string;
	documentId: string;
	provider: string;
	now: Date;
	staleAfterMs: number;
};

export type AcquireProcessLockResult =
	| { outcome: "not_found" }
	| { outcome: "already_ready" }
	| { outcome: "not_allowed" }
	| { outcome: "in_progress" }
	| { outcome: "acquired"; document: ProcessDocumentRow; run: ProcessRunRow };

export type CompleteProcessRunInput = {
	taxProfileId: string;
	createFourthIncomeAttention: boolean;
	documentId: string;
	runId: string;
	documentStatus: "ready" | "needs_review" | "failed";
	extracted: NormalizedExtraction;
	fieldConfidence: ExtractionDecision["fieldConfidence"];
	doubtfulFields: ExtractionDecision["doubtfulFields"];
	attemptNumber: number;
	rawResultObjectKey: string;
	provider: string;
	providerVersion: string;
	now: Date;
};

export type FailProcessRunInput = {
	documentId: string;
	runId: string;
	errorCode: "OCR_PROVIDER_UNAVAILABLE" | "OCR_RESULT_INVALID";
	now: Date;
};

export interface DocumentProcessingRepositoryPort {
	acquireLock(input: AcquireProcessLockInput): Promise<AcquireProcessLockResult>;
	completeRun(input: CompleteProcessRunInput): Promise<void>;
	failRun(input: FailProcessRunInput): Promise<void>;
}

function toProcessDocument(row: typeof documents.$inferSelect): ProcessDocumentRow {
	return {
		id: row.id,
		taxProfileId: row.taxProfileId,
		status: row.status,
		objectKey: row.objectKey,
		mimeType: row.mimeType as "image/jpeg" | "image/png",
		deletedAt: row.deletedAt,
	};
}

function isFreshLock(startedAt: Date | null, now: Date, staleAfterMs: number): boolean {
	if (startedAt === null) {
		return false;
	}
	return now.getTime() - startedAt.getTime() <= staleAfterMs;
}

function toProcessRun(run: typeof documentProcessingRuns.$inferSelect): ProcessRunRow {
	return {
		id: run.id,
		documentId: run.documentId,
		attemptNumber: run.attemptNumber,
		status: run.status,
		startedAt: run.startedAt,
		provider: run.provider,
		pipelineVersion: run.pipelineVersion,
	};
}

@Injectable()
export class DocumentProcessingRepository implements DocumentProcessingRepositoryPort {
	constructor(
		@Inject(DATABASE)
		private readonly db: Database,
	) {}

	async acquireLock(input: AcquireProcessLockInput): Promise<AcquireProcessLockResult> {
		return this.db.transaction(async (tx) => {
			const [row] = await tx
				.select()
				.from(documents)
				.where(
					and(eq(documents.taxProfileId, input.taxProfileId), eq(documents.id, input.documentId)),
				)
				.limit(1)
				.for("update");

			if (!row || row.deletedAt !== null) {
				return { outcome: "not_found" };
			}

			if (row.status === "ready") {
				return { outcome: "already_ready" };
			}

			if (row.status === "needs_review" || row.status === "pending_upload") {
				return { outcome: "not_allowed" };
			}

			const [lastExtraction] = await tx
				.select()
				.from(documentProcessingRuns)
				.where(
					and(
						eq(documentProcessingRuns.documentId, row.id),
						eq(documentProcessingRuns.processingType, "extraction"),
					),
				)
				.orderBy(desc(documentProcessingRuns.attemptNumber))
				.limit(1);

			if (
				row.status === "processing" &&
				isFreshLock(lastExtraction?.startedAt ?? null, input.now, input.staleAfterMs)
			) {
				return { outcome: "in_progress" };
			}

			if (!LOCKABLE_STATUSES.includes(row.status as (typeof LOCKABLE_STATUSES)[number])) {
				return { outcome: "not_allowed" };
			}

			const locked = await tx
				.update(documents)
				.set({ status: "processing" })
				.where(and(eq(documents.id, row.id), inArray(documents.status, LOCKABLE_STATUSES)))
				.returning({ id: documents.id });

			if (locked.length === 0) {
				return { outcome: "not_allowed" };
			}

			const attemptNumber = (lastExtraction?.attemptNumber ?? 0) + 1;
			const runValues = {
				processingType: "extraction" as const,
				attemptNumber,
				provider: input.provider,
				pipelineVersion: PIPELINE_VERSION,
				status: "processing" as const,
				startedAt: input.now,
				finishedAt: null,
				errorCode: null,
				errorMessage: null,
				rawResultObjectKey: null,
				normalizedResult: {},
				fieldConfidence: {},
			};

			if (lastExtraction) {
				await tx
					.delete(documentProcessingRuns)
					.where(
						and(
							eq(documentProcessingRuns.documentId, row.id),
							eq(documentProcessingRuns.processingType, "extraction"),
							ne(documentProcessingRuns.id, lastExtraction.id),
						),
					);
			}

			const [run] = lastExtraction
				? await tx
						.update(documentProcessingRuns)
						.set(runValues)
						.where(eq(documentProcessingRuns.id, lastExtraction.id))
						.returning()
				: await tx
						.insert(documentProcessingRuns)
						.values({
							documentId: row.id,
							...runValues,
						})
						.returning();

			if (!run) {
				throw new Error("Processing run could not be persisted");
			}

			return {
				outcome: "acquired",
				document: toProcessDocument({ ...row, status: "processing" }),
				run: toProcessRun(run),
			};
		});
	}

	async completeRun(input: CompleteProcessRunInput): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx
				.update(documents)
				.set({
					status: input.documentStatus,
					issuerName: input.extracted.issuerName,
					issuerTaxId: input.extracted.issuerTaxId,
					issueDate: input.extracted.issueDate,
					documentType: input.extracted.documentType,
					documentNumber: input.extracted.documentNumber,
					currencyCode: input.extracted.currencyCode,
					subtotalAmount: input.extracted.subtotalAmount,
					taxAmount: input.extracted.taxAmount,
					totalAmount: input.extracted.totalAmount,
					processedAt: input.now,
					metadata: {
						doubtfulFields: input.doubtfulFields,
						attemptNumber: input.attemptNumber,
					},
				})
				.where(eq(documents.id, input.documentId));

			await tx
				.update(documentProcessingRuns)
				.set({
					status: "succeeded",
					finishedAt: input.now,
					normalizedResult: input.extracted,
					fieldConfidence: input.fieldConfidence,
					rawResultObjectKey: input.rawResultObjectKey,
					provider: input.provider,
					providerVersion: input.providerVersion,
				})
				.where(eq(documentProcessingRuns.id, input.runId));

			const attention = input.createFourthIncomeAttention
				? buildFourthIncomeAttention({
						taxProfileId: input.taxProfileId,
						documentId: input.documentId,
						documentType: input.extracted.documentType,
						currencyCode: input.extracted.currencyCode,
					})
				: null;
			if (attention) {
				await tx.insert(attentionItems).values(attention).onConflictDoNothing();
			}
		});
	}

	async failRun(input: FailProcessRunInput): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx
				.update(documents)
				.set({ status: "failed" })
				.where(eq(documents.id, input.documentId));

			await tx
				.update(documentProcessingRuns)
				.set({
					status: "failed",
					finishedAt: input.now,
					errorCode: input.errorCode,
				})
				.where(eq(documentProcessingRuns.id, input.runId));
		});
	}
}
