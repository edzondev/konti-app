import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { and, count, desc, eq, gte, isNotNull, isNull, lt, lte, or, sql } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import {
	attentionItems,
	documentProcessingRuns,
	documents,
	taxIncomeRecords,
	taxProfiles,
} from "../../database/schema";
import type {
	InsertDocumentTaxIncome,
	InsertManualTaxIncome,
	TaxIncomeRecord,
	TaxIncomeRepositoryPort,
	TaxIncomeSourceDocument,
	UpdateTaxIncomeValues,
} from "./tax-income.types";
import type { FourthIncomeCandidateSource } from "./tax-income-candidate";

@Injectable()
export class TaxIncomeRepository implements TaxIncomeRepositoryPort {
	constructor(
		@Inject(DATABASE)
		private readonly db: Database,
	) {}

	async lockTaxProfileForEvaluation(
		executor: DatabaseExecutor,
		taxProfileId: string,
	): Promise<void> {
		const [profile] = await executor
			.select({ id: taxProfiles.id })
			.from(taxProfiles)
			.where(eq(taxProfiles.id, taxProfileId))
			.limit(1)
			.for("update");

		if (!profile) {
			throw new Error("Tax profile could not be locked for evaluation");
		}
	}

	async findByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	) {
		const [record] = await executor
			.select()
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.idempotencyKey, idempotencyKey),
					eq(taxIncomeRecords.source, "manual"),
				),
			)
			.limit(1);

		return record ? this.toRecord(record) : undefined;
	}

	async insertManual(executor: DatabaseExecutor, values: InsertManualTaxIncome) {
		const [record] = await executor
			.insert(taxIncomeRecords)
			.values({
				taxProfileId: values.taxProfileId,
				sourceDocumentId: null,
				incomeType: "independent_services",
				source: "manual",
				idempotencyKey: values.idempotencyKey,
				receivedAt: values.receivedAt,
				grossAmount: values.grossAmount,
				withheldTaxAmount: values.withheldTaxAmount,
				currencyCode: "PEN",
				exchangeRate: null,
				grossAmountPen: values.grossAmount,
				withheldTaxAmountPen: values.withheldTaxAmount,
				payerName: values.payerName,
				payerTaxId: null,
				status: "confirmed",
				notes: values.notes,
			})
			.onConflictDoNothing()
			.returning();

		return record ? this.toRecord(record) : undefined;
	}

	async getOwnedForUpdate(executor: DatabaseExecutor, taxProfileId: string, recordId: string) {
		const [record] = await executor
			.select()
			.from(taxIncomeRecords)
			.where(this.ownedVisibleCondition(taxProfileId, recordId))
			.limit(1)
			.for("update");

		return record ? this.toRecord(record) : undefined;
	}

	async updateOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		values: UpdateTaxIncomeValues,
	) {
		const set: Partial<typeof taxIncomeRecords.$inferInsert> = {};
		if (values.receivedAt !== undefined) set.receivedAt = values.receivedAt;
		if (values.grossAmount !== undefined) {
			set.grossAmount = values.grossAmount;
			set.grossAmountPen = values.grossAmount;
		}
		if (values.withheldTaxAmount !== undefined) {
			set.withheldTaxAmount = values.withheldTaxAmount;
			set.withheldTaxAmountPen = values.withheldTaxAmount;
		}
		if (values.payerName !== undefined) set.payerName = values.payerName;
		if (values.notes !== undefined) set.notes = values.notes;

		const [record] = await executor
			.update(taxIncomeRecords)
			.set(set)
			.where(this.ownedVisibleCondition(taxProfileId, recordId))
			.returning();

		return record ? this.toRecord(record) : undefined;
	}

	async softDeleteOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		deletedAt: Date,
	) {
		const [record] = await executor
			.update(taxIncomeRecords)
			.set({ deletedAt })
			.where(this.ownedVisibleCondition(taxProfileId, recordId))
			.returning();

		return record ? this.toRecord(record) : undefined;
	}

	async getOwned(executor: DatabaseExecutor | undefined, taxProfileId: string, recordId: string) {
		const database = executor ?? this.db;
		const [record] = await database
			.select()
			.from(taxIncomeRecords)
			.where(this.ownedVisibleCondition(taxProfileId, recordId))
			.limit(1);

		return record ? this.toRecord(record) : undefined;
	}

	async listVisible(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		query: Parameters<TaxIncomeRepositoryPort["listVisible"]>[2],
	) {
		const database = executor ?? this.db;
		const cursorCondition = query.cursor
			? or(
					lt(taxIncomeRecords.receivedAt, query.cursor.receivedAt),
					and(
						eq(taxIncomeRecords.receivedAt, query.cursor.receivedAt),
						lt(taxIncomeRecords.createdAt, new Date(query.cursor.createdAt)),
					),
					and(
						eq(taxIncomeRecords.receivedAt, query.cursor.receivedAt),
						eq(taxIncomeRecords.createdAt, new Date(query.cursor.createdAt)),
						lt(taxIncomeRecords.id, query.cursor.id),
					),
				)
			: undefined;
		const rows = await database
			.select()
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.incomeType, "independent_services"),
					eq(taxIncomeRecords.status, "confirmed"),
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNotNull(taxIncomeRecords.grossAmountPen),
					isNotNull(taxIncomeRecords.withheldTaxAmountPen),
					isNull(taxIncomeRecords.deletedAt),
					gte(taxIncomeRecords.receivedAt, "2026-01-01"),
					lte(taxIncomeRecords.receivedAt, "2026-12-31"),
					cursorCondition,
				),
			)
			.orderBy(
				desc(taxIncomeRecords.receivedAt),
				desc(taxIncomeRecords.createdAt),
				desc(taxIncomeRecords.id),
			)
			.limit(query.limit + 1);

		return rows.map((row) => this.toRecord(row));
	}

	async sumVisible(executor: DatabaseExecutor | undefined, taxProfileId: string, _taxYear: 2026) {
		const database = executor ?? this.db;
		const [summary] = await database
			.select({
				grossAmount: sql<string>`coalesce(sum(${taxIncomeRecords.grossAmountPen}), 0)::text`,
				withheldTaxAmount: sql<string>`coalesce(sum(${taxIncomeRecords.withheldTaxAmountPen}), 0)::text`,
				count: count(),
			})
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.incomeType, "independent_services"),
					eq(taxIncomeRecords.status, "confirmed"),
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNotNull(taxIncomeRecords.grossAmountPen),
					isNotNull(taxIncomeRecords.withheldTaxAmountPen),
					isNull(taxIncomeRecords.deletedAt),
					gte(taxIncomeRecords.receivedAt, "2026-01-01"),
					lte(taxIncomeRecords.receivedAt, "2026-12-31"),
				),
			);

		return {
			grossAmount: new Decimal(summary?.grossAmount ?? "0").toFixed(2),
			withheldTaxAmount: new Decimal(summary?.withheldTaxAmount ?? "0").toFixed(2),
			count: summary?.count ?? 0,
		};
	}

	async getDocumentForUpdate(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	): Promise<TaxIncomeSourceDocument | undefined> {
		const [document] = await executor
			.select()
			.from(documents)
			.where(
				and(
					eq(documents.id, documentId),
					eq(documents.taxProfileId, taxProfileId),
					isNull(documents.deletedAt),
				),
			)
			.limit(1)
			.for("update");
		if (!document) return undefined;

		const normalizedResult = await this.findLatestNormalizedResult(executor, documentId);
		return {
			id: document.id,
			taxProfileId: document.taxProfileId,
			status: document.status,
			documentType: document.documentType,
			currencyCode: document.currencyCode,
			issueDate: document.issueDate,
			taxRelevanceStatus: document.taxRelevanceStatus,
			normalizedResult,
		};
	}

	async findActiveBySourceDocument(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	) {
		const [record] = await executor
			.select()
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.sourceDocumentId, documentId),
					isNull(taxIncomeRecords.deletedAt),
				),
			)
			.limit(1);

		return record ? this.toRecord(record) : undefined;
	}

	async insertDocumentIncome(executor: DatabaseExecutor, values: InsertDocumentTaxIncome) {
		const [record] = await executor
			.insert(taxIncomeRecords)
			.values({
				taxProfileId: values.taxProfileId,
				sourceDocumentId: values.sourceDocumentId,
				incomeType: "independent_services",
				source: "document",
				idempotencyKey: null,
				receivedAt: values.receivedAt,
				grossAmount: values.grossAmount,
				withheldTaxAmount: values.withheldTaxAmount,
				currencyCode: "PEN",
				exchangeRate: null,
				grossAmountPen: values.grossAmount,
				withheldTaxAmountPen: values.withheldTaxAmount,
				payerName: values.payerName,
				payerTaxId: null,
				status: "confirmed",
				notes: values.notes,
			})
			.onConflictDoNothing()
			.returning();

		return record ? this.toRecord(record) : undefined;
	}

	async resolveFourthIncomeAttention(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
		resolution: Record<string, unknown>,
	): Promise<void> {
		const now = new Date();
		await executor
			.update(attentionItems)
			.set({ status: "resolved", resolution, resolvedAt: now })
			.where(
				and(
					eq(attentionItems.taxProfileId, taxProfileId),
					eq(attentionItems.documentId, documentId),
					eq(attentionItems.itemType, "confirm_fourth_income"),
					eq(attentionItems.status, "open"),
				),
			);
	}

	async getDocumentCandidateSource(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		documentId: string,
	): Promise<FourthIncomeCandidateSource | undefined> {
		const database = executor ?? this.db;
		const [document] = await database
			.select()
			.from(documents)
			.where(
				and(
					eq(documents.id, documentId),
					eq(documents.taxProfileId, taxProfileId),
					isNull(documents.deletedAt),
				),
			)
			.limit(1);
		if (!document) return undefined;

		const [normalizedResult, activeIncome, attention] = await Promise.all([
			this.findLatestNormalizedResult(database, documentId),
			database
				.select({ id: taxIncomeRecords.id })
				.from(taxIncomeRecords)
				.where(
					and(
						eq(taxIncomeRecords.taxProfileId, taxProfileId),
						eq(taxIncomeRecords.sourceDocumentId, documentId),
						isNull(taxIncomeRecords.deletedAt),
					),
				)
				.limit(1),
			database
				.select({ status: attentionItems.status, resolution: attentionItems.resolution })
				.from(attentionItems)
				.where(
					and(
						eq(attentionItems.taxProfileId, taxProfileId),
						eq(attentionItems.documentId, documentId),
						eq(attentionItems.itemType, "confirm_fourth_income"),
					),
				)
				.limit(1),
		]);
		const resolution = attention[0]?.resolution;
		const decision: FourthIncomeCandidateSource["decision"] =
			resolution?.decision === "not_mine" || resolution?.decision === "confirmed"
				? resolution.decision
				: null;

		return {
			documentType: document.documentType,
			status: document.status,
			issueDate: document.issueDate,
			currencyCode: document.currencyCode,
			hasActiveIncome: activeIncome.length > 0,
			decision,
			normalizedResult,
		};
	}

	private async findLatestNormalizedResult(
		executor: DatabaseExecutor,
		documentId: string,
	): Promise<Record<string, unknown>> {
		const [run] = await executor
			.select({ normalizedResult: documentProcessingRuns.normalizedResult })
			.from(documentProcessingRuns)
			.where(
				and(
					eq(documentProcessingRuns.documentId, documentId),
					eq(documentProcessingRuns.processingType, "extraction"),
					eq(documentProcessingRuns.status, "succeeded"),
				),
			)
			.orderBy(desc(documentProcessingRuns.attemptNumber))
			.limit(1);

		return run?.normalizedResult ?? {};
	}

	private ownedVisibleCondition(taxProfileId: string, recordId: string) {
		return and(
			eq(taxIncomeRecords.id, recordId),
			eq(taxIncomeRecords.taxProfileId, taxProfileId),
			eq(taxIncomeRecords.incomeType, "independent_services"),
			eq(taxIncomeRecords.status, "confirmed"),
			eq(taxIncomeRecords.currencyCode, "PEN"),
			isNotNull(taxIncomeRecords.grossAmountPen),
			isNotNull(taxIncomeRecords.withheldTaxAmountPen),
			isNull(taxIncomeRecords.deletedAt),
		);
	}

	private toRecord(row: typeof taxIncomeRecords.$inferSelect): TaxIncomeRecord {
		return {
			id: row.id,
			taxProfileId: row.taxProfileId,
			sourceDocumentId: row.sourceDocumentId,
			incomeType: "independent_services",
			source: row.source === "document" ? "document" : "manual",
			idempotencyKey: row.idempotencyKey,
			receivedAt: row.receivedAt,
			grossAmount: row.grossAmount,
			withheldTaxAmount: row.withheldTaxAmount,
			currencyCode: "PEN",
			exchangeRate: null,
			grossAmountPen: row.grossAmountPen ?? row.grossAmount,
			withheldTaxAmountPen: row.withheldTaxAmountPen ?? row.withheldTaxAmount,
			payerName: row.payerName,
			payerTaxId: null,
			status: "confirmed",
			notes: row.notes,
			deletedAt: row.deletedAt,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
