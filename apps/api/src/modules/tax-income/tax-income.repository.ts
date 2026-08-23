import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { and, desc, eq, gte, inArray, isNotNull, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import {
	attentionItems,
	documentProcessingRuns,
	documents,
	taxIncomeRecords,
	taxProfiles,
} from "../../database/schema";
import { resolveEmploymentCoverage } from "./employment-coverage";
import type {
	InsertDocumentTaxIncome,
	InsertManualTaxIncome,
	TaxIncomeRecord,
	TaxIncomeRepositoryPort,
	TaxIncomeSourceDocument,
	UpdateTaxIncomeValues,
} from "./tax-income.types";
import type { FourthIncomeCandidateSource } from "./tax-income-candidate";

const FOURTH_INCOME_COLLECTION_ATTENTION = {
	priority: "normal" as const,
	title: "Confirma si este RHE ya fue cobrado",
	message: "Registra la fecha real cuando recibas el pago.",
	actionType: "confirm_fourth_income" as const,
};

const FOURTH_INCOME_ACTIVITY_ATTENTION = {
	priority: "normal" as const,
	title: "Confirma qué tipo de actividad realizaste",
	message: "No incluiremos este recibo en tu estimación hasta que confirmes la actividad.",
	actionType: "confirm_fourth_income" as const,
};

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
		const employment = "incomeType" in values;
		const [record] = await executor
			.insert(taxIncomeRecords)
			.values({
				taxProfileId: values.taxProfileId,
				sourceDocumentId: null,
				incomeType: employment ? "employment" : values.activityType,
				activityClassificationSource: employment ? null : "manual_confirmation",
				source: "manual",
				idempotencyKey: values.idempotencyKey,
				receivedAt: employment ? null : values.receivedAt,
				recordKind: employment ? values.recordKind : "payment",
				coverageStart: employment ? values.coverageStart : null,
				coverageEnd: employment ? values.coverageEnd : null,
				coverageScope: employment ? values.coverageScope : null,
				calculationDisposition: "included",
				coveredByRecordId: null,
				coverageResolutionReason: null,
				grossAmount: values.grossAmount,
				withheldTaxAmount: values.withheldTaxAmount,
				currencyCode: "PEN",
				exchangeRate: null,
				grossAmountPen: values.grossAmount,
				withheldTaxAmountPen: values.withheldTaxAmount,
				payerName: values.payerName,
				payerTaxId: employment ? values.payerTaxId : null,
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
		if ("incomeType" in values) {
			if (values.recordKind !== undefined) set.recordKind = values.recordKind;
			if (values.coverageStart !== undefined) set.coverageStart = values.coverageStart;
			if (values.coverageEnd !== undefined) set.coverageEnd = values.coverageEnd;
			if (values.coverageScope !== undefined) set.coverageScope = values.coverageScope;
			if (values.payerTaxId !== undefined) set.payerTaxId = values.payerTaxId;
		} else if (values.activityType !== undefined) {
			set.incomeType = values.activityType;
			set.activityClassificationSource = "manual_confirmation";
		}
		if (!("incomeType" in values) && values.receivedAt !== undefined) {
			set.receivedAt = values.receivedAt;
		}
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
		const orderingDate = sql<string>`coalesce(${taxIncomeRecords.receivedAt}, ${taxIncomeRecords.coverageEnd})`;
		const incomeTypes =
			query.type === "employment"
				? (["employment"] as const)
				: query.type === "fourth"
					? (["fourth_ordinary", "fourth_special"] as const)
					: (["fourth_ordinary", "fourth_special", "employment"] as const);
		const cursorCondition = query.cursor
			? or(
					lt(orderingDate, query.cursor.receivedAt),
					and(
						eq(orderingDate, query.cursor.receivedAt),
						lt(taxIncomeRecords.createdAt, new Date(query.cursor.createdAt)),
					),
					and(
						eq(orderingDate, query.cursor.receivedAt),
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
					inArray(taxIncomeRecords.incomeType, incomeTypes),
					eq(taxIncomeRecords.status, "confirmed"),
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNotNull(taxIncomeRecords.grossAmountPen),
					isNotNull(taxIncomeRecords.withheldTaxAmountPen),
					isNull(taxIncomeRecords.deletedAt),
					gte(orderingDate, "2026-01-01"),
					lte(orderingDate, "2026-12-31"),
					cursorCondition,
				),
			)
			.orderBy(desc(orderingDate), desc(taxIncomeRecords.createdAt), desc(taxIncomeRecords.id))
			.limit(query.limit + 1);

		return rows.map((row) => this.toRecord(row));
	}

	async sumVisible(executor: DatabaseExecutor | undefined, taxProfileId: string, _taxYear: 2026) {
		const database = executor ?? this.db;
		const [summary] = await database
			.select({
				grossAmount: sql<string>`coalesce(sum(case when ${taxIncomeRecords.incomeType} <> 'employment' or ${taxIncomeRecords.calculationDisposition} = 'included' then ${taxIncomeRecords.grossAmountPen} else 0 end), 0)::text`,
				withheldTaxAmount: sql<string>`coalesce(sum(case when ${taxIncomeRecords.incomeType} <> 'employment' or ${taxIncomeRecords.calculationDisposition} = 'included' then ${taxIncomeRecords.withheldTaxAmountPen} else 0 end), 0)::text`,
				count: sql<number>`count(*) filter (where ${taxIncomeRecords.incomeType} <> 'employment' or ${taxIncomeRecords.calculationDisposition} = 'included')::int`,
				fourthGrossAmount: sql<string>`coalesce(sum(case when ${taxIncomeRecords.incomeType} in ('fourth_ordinary', 'fourth_special') then ${taxIncomeRecords.grossAmountPen} else 0 end), 0)::text`,
				employmentGrossAmount: sql<string>`coalesce(sum(case when ${taxIncomeRecords.incomeType} = 'employment' and ${taxIncomeRecords.calculationDisposition} = 'included' then ${taxIncomeRecords.grossAmountPen} else 0 end), 0)::text`,
				withheldFourth: sql<string>`coalesce(sum(case when ${taxIncomeRecords.incomeType} in ('fourth_ordinary', 'fourth_special') then ${taxIncomeRecords.withheldTaxAmountPen} else 0 end), 0)::text`,
				withheldFifth: sql<string>`coalesce(sum(case when ${taxIncomeRecords.incomeType} = 'employment' and ${taxIncomeRecords.calculationDisposition} = 'included' then ${taxIncomeRecords.withheldTaxAmountPen} else 0 end), 0)::text`,
				fourthCount: sql<number>`count(*) filter (where ${taxIncomeRecords.incomeType} in ('fourth_ordinary', 'fourth_special'))::int`,
				employmentCount: sql<number>`count(*) filter (where ${taxIncomeRecords.incomeType} = 'employment' and ${taxIncomeRecords.calculationDisposition} = 'included')::int`,
			})
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					inArray(taxIncomeRecords.incomeType, ["fourth_ordinary", "fourth_special", "employment"]),
					eq(taxIncomeRecords.status, "confirmed"),
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNotNull(taxIncomeRecords.grossAmountPen),
					isNotNull(taxIncomeRecords.withheldTaxAmountPen),
					isNull(taxIncomeRecords.deletedAt),
					gte(
						sql<string>`coalesce(${taxIncomeRecords.receivedAt}, ${taxIncomeRecords.coverageEnd})`,
						"2026-01-01",
					),
					lte(
						sql<string>`coalesce(${taxIncomeRecords.receivedAt}, ${taxIncomeRecords.coverageEnd})`,
						"2026-12-31",
					),
				),
			);

		return {
			grossAmount: new Decimal(summary?.grossAmount ?? "0").toFixed(2),
			withheldTaxAmount: new Decimal(summary?.withheldTaxAmount ?? "0").toFixed(2),
			count: summary?.count ?? 0,
			fourthGrossAmount: new Decimal(summary?.fourthGrossAmount ?? "0").toFixed(2),
			employmentGrossAmount: new Decimal(summary?.employmentGrossAmount ?? "0").toFixed(2),
			withheldFourth: new Decimal(summary?.withheldFourth ?? "0").toFixed(2),
			withheldFifth: new Decimal(summary?.withheldFifth ?? "0").toFixed(2),
			fourthCount: summary?.fourthCount ?? 0,
			employmentCount: summary?.employmentCount ?? 0,
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
		const employment = "incomeType" in values;
		const [record] = await executor
			.insert(taxIncomeRecords)
			.values({
				taxProfileId: values.taxProfileId,
				sourceDocumentId: values.sourceDocumentId,
				incomeType: employment ? "employment" : values.activityType,
				activityClassificationSource: employment ? null : "manual_confirmation",
				source: "document",
				idempotencyKey: null,
				receivedAt: employment ? null : values.receivedAt,
				recordKind: employment ? values.recordKind : "payment",
				coverageStart: employment ? values.coverageStart : null,
				coverageEnd: employment ? values.coverageEnd : null,
				coverageScope: employment ? values.coverageScope : null,
				calculationDisposition: "included",
				coveredByRecordId: null,
				coverageResolutionReason: null,
				grossAmount: values.grossAmount,
				withheldTaxAmount: values.withheldTaxAmount,
				currencyCode: "PEN",
				exchangeRate: null,
				grossAmountPen: values.grossAmount,
				withheldTaxAmountPen: values.withheldTaxAmount,
				payerName: values.payerName,
				payerTaxId: employment ? values.payerTaxId : null,
				status: "confirmed",
				notes: values.notes,
			})
			.onConflictDoNothing()
			.returning();

		return record ? this.toRecord(record) : undefined;
	}

	async recalculateEmploymentCoverage(
		executor: DatabaseExecutor,
		taxProfileId: string,
	): Promise<void> {
		const rows = await executor
			.select()
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.incomeType, "employment"),
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNull(taxIncomeRecords.deletedAt),
					isNotNull(taxIncomeRecords.coverageStart),
					isNotNull(taxIncomeRecords.coverageEnd),
					isNotNull(taxIncomeRecords.coverageScope),
				),
			)
			.for("update");

		const completeRows = rows
			.filter(
				(row) =>
					row.recordKind !== "payment" &&
					row.coverageStart !== null &&
					row.coverageEnd !== null &&
					row.coverageScope !== null,
			)
			.map((row) => this.toRecord(row));
		await this.persistEmploymentCoverage(executor, taxProfileId, completeRows);
	}

	private async persistEmploymentCoverage(
		executor: DatabaseExecutor,
		taxProfileId: string,
		completeRows: readonly TaxIncomeRecord[],
		targetRecordId?: string,
		alreadyPersistedRecordIds: ReadonlySet<string> = new Set(),
	): Promise<TaxIncomeRecord | undefined> {
		const activeRecordIds = new Set(completeRows.map((row) => row.id));
		const resolutions = resolveEmploymentCoverage(
			completeRows.map((row) => {
				const manualSeparate = row.coverageResolutionReason === "user_confirmed_separate_income";
				const manualCovered =
					row.coverageResolutionReason === "user_confirmed_covered_by_record" &&
					typeof row.coveredByRecordId === "string" &&
					activeRecordIds.has(row.coveredByRecordId);
				return {
					id: row.id,
					taxProfileId: row.taxProfileId,
					recordKind: row.recordKind as "period" | "year_to_date_snapshot",
					coverageStart: row.coverageStart as string,
					coverageEnd: row.coverageEnd as string,
					coverageScope: row.coverageScope as "single_payer" | "all_employers",
					payerTaxId: row.payerTaxId,
					payerName: row.payerName,
					status: row.status,
					calculationDisposition: manualCovered ? "excluded_by_coverage" : "included",
					coveredByRecordId: manualCovered ? (row.coveredByRecordId ?? null) : null,
					coverageResolutionReason:
						manualSeparate || manualCovered
							? (row.coverageResolutionReason as Parameters<
									typeof resolveEmploymentCoverage
								>[0][number]["coverageResolutionReason"])
							: null,
					grossAmount: row.grossAmountPen ?? row.grossAmount,
					withheldTaxAmount: row.withheldTaxAmountPen ?? row.withheldTaxAmount,
					sourceDocumentId: row.sourceDocumentId,
				};
			}),
		);

		await executor
			.update(attentionItems)
			.set({ status: "resolved", resolvedAt: new Date() })
			.where(
				and(
					eq(attentionItems.taxProfileId, taxProfileId),
					eq(attentionItems.itemType, "resolve_employment_coverage"),
					eq(attentionItems.status, "open"),
				),
			);

		const resolutionsToPersist = resolutions.filter(
			(resolution) => !alreadyPersistedRecordIds.has(resolution.recordId),
		);
		if (resolutionsToPersist.length > 0) {
			const values = sql.join(
				resolutionsToPersist.map(
					(resolution) => sql`(
						${resolution.recordId}::uuid,
						${resolution.calculationDisposition}::text,
						${resolution.coveredByRecordId}::uuid,
						${resolution.coverageResolutionReason}::text
					)`,
				),
				sql`, `,
			);
			await executor.execute(sql`
				UPDATE ${taxIncomeRecords}
				SET
					calculation_disposition = batch.calculation_disposition,
					covered_by_record_id = batch.covered_by_record_id,
					coverage_resolution_reason = batch.coverage_resolution_reason,
					updated_at = now()
				FROM (VALUES ${values}) AS batch(
					record_id,
					calculation_disposition,
					covered_by_record_id,
					coverage_resolution_reason
				)
				WHERE ${taxIncomeRecords.id} = batch.record_id
					AND ${taxIncomeRecords.taxProfileId} = ${taxProfileId}
			`);
		}

		const conflicts = resolutions.filter(
			(resolution) => resolution.calculationDisposition === "needs_resolution",
		);
		if (conflicts.length > 0) {
			await executor
				.insert(attentionItems)
				.values(
					conflicts.map((resolution) => ({
						taxProfileId,
						source: "tax_engine" as const,
						itemType: "resolve_employment_coverage",
						status: "open" as const,
						priority: "normal" as const,
						title: "Revisa un cruce de ingresos en planilla",
						message: "Confirma qué constancia cubre este periodo antes de incluirla.",
						actionType: "resolve_employment_coverage",
						actionPayload: { recordId: resolution.recordId },
						resolution: null,
						deduplicationKey: `employment-coverage:${resolution.recordId}`,
						resolvedAt: null,
					})),
				)
				.onConflictDoUpdate({
					target: [attentionItems.taxProfileId, attentionItems.deduplicationKey],
					set: {
						status: "open",
						actionPayload: sql`excluded.action_payload`,
						resolution: null,
						resolvedAt: null,
					},
				});
		}

		const target = targetRecordId
			? completeRows.find((record) => record.id === targetRecordId)
			: undefined;
		const targetResolution = targetRecordId
			? resolutions.find((resolution) => resolution.recordId === targetRecordId)
			: undefined;
		return target && targetResolution
			? {
					...target,
					calculationDisposition: targetResolution.calculationDisposition,
					coveredByRecordId: targetResolution.coveredByRecordId,
					coverageResolutionReason: targetResolution.coverageResolutionReason,
				}
			: undefined;
	}

	async resolveEmploymentCoverageConflict(
		executor: DatabaseExecutor,
		taxProfileId: string,
		current: TaxIncomeRecord,
		decision: "include_separately" | "exclude_as_covered",
	): Promise<TaxIncomeRecord | undefined> {
		const rows = await executor
			.select()
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.incomeType, "employment"),
					eq(taxIncomeRecords.status, "confirmed"),
					isNull(taxIncomeRecords.deletedAt),
					ne(taxIncomeRecords.id, current.id),
				),
			)
			.for("update");
		const lockedRecords = [current, ...rows.map((row) => this.toRecord(row))];
		const targetCoverageStart = current.coverageStart;
		const targetCoverageEnd = current.coverageEnd;
		if (!targetCoverageStart || !targetCoverageEnd) return undefined;

		let coveredByRecordId: string | null = null;
		if (decision === "exclude_as_covered") {
			const normalizedTargetName = this.normalizePayerName(current.payerName);
			const provider = lockedRecords
				.filter(
					(row) =>
						row.id !== current.id &&
						typeof row.coverageStart === "string" &&
						typeof row.coverageEnd === "string" &&
						row.coverageStart <= targetCoverageStart &&
						row.coverageEnd >= targetCoverageEnd &&
						row.calculationDisposition !== "excluded_by_coverage" &&
						(row.coverageScope === "all_employers" ||
							(current.payerTaxId !== null && current.payerTaxId === row.payerTaxId) ||
							(normalizedTargetName !== null &&
								normalizedTargetName === this.normalizePayerName(row.payerName))),
				)
				.sort((left, right) => left.id.localeCompare(right.id))[0];
			if (!provider) return undefined;
			coveredByRecordId = provider.id;
		}

		const [updated] = await executor
			.update(taxIncomeRecords)
			.set({
				calculationDisposition:
					decision === "include_separately" ? "included" : "excluded_by_coverage",
				coveredByRecordId,
				coverageResolutionReason:
					decision === "include_separately"
						? "user_confirmed_separate_income"
						: "user_confirmed_covered_by_record",
			})
			.where(
				and(eq(taxIncomeRecords.id, current.id), eq(taxIncomeRecords.taxProfileId, taxProfileId)),
			)
			.returning();
		if (!updated) return undefined;
		const updatedRecord = this.toRecord(updated);
		const recalculationSnapshot = lockedRecords.map((record) =>
			record.id === current.id ? updatedRecord : record,
		);
		return (
			(await this.persistEmploymentCoverage(
				executor,
				taxProfileId,
				recalculationSnapshot,
				current.id,
				new Set([current.id]),
			)) ?? updatedRecord
		);
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

	async keepFourthIncomeAttentionOpen(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
		decision: "unpaid" | "unsure" | "activity_unsure",
	): Promise<void> {
		const attention =
			decision === "activity_unsure"
				? FOURTH_INCOME_ACTIVITY_ATTENTION
				: FOURTH_INCOME_COLLECTION_ATTENTION;
		await executor
			.insert(attentionItems)
			.values({
				taxProfileId,
				documentId,
				source: "document_processing",
				itemType: "confirm_fourth_income",
				status: "open",
				priority: attention.priority,
				title: attention.title,
				message: attention.message,
				actionType: attention.actionType,
				actionPayload: { documentId },
				resolution: { decision },
				deduplicationKey: `fourth-income:${documentId}`,
				resolvedAt: null,
			})
			.onConflictDoUpdate({
				target: [attentionItems.taxProfileId, attentionItems.deduplicationKey],
				set: {
					status: "open",
					priority: attention.priority,
					title: attention.title,
					message: attention.message,
					actionType: attention.actionType,
					actionPayload: { documentId },
					resolution: { decision },
					resolvedAt: null,
				},
			});
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
			resolution?.decision === "not_mine" ||
			resolution?.decision === "paid" ||
			resolution?.decision === "unpaid" ||
			resolution?.decision === "unsure" ||
			resolution?.decision === "activity_unsure"
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
			inArray(taxIncomeRecords.incomeType, ["fourth_ordinary", "fourth_special", "employment"]),
			eq(taxIncomeRecords.status, "confirmed"),
			eq(taxIncomeRecords.currencyCode, "PEN"),
			isNotNull(taxIncomeRecords.grossAmountPen),
			isNotNull(taxIncomeRecords.withheldTaxAmountPen),
			isNull(taxIncomeRecords.deletedAt),
		);
	}

	private normalizePayerName(value: string | null): string | null {
		if (!value) return null;
		const normalized = value
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLocaleLowerCase("es-PE")
			.replace(/[^a-z0-9]/g, "");
		return normalized.length > 0 ? normalized : null;
	}

	private toRecord(row: typeof taxIncomeRecords.$inferSelect): TaxIncomeRecord {
		if (row.incomeType !== "employment" && row.activityClassificationSource === null) {
			throw new Error("Fourth income record has an invalid activity classification");
		}
		if (
			row.incomeType === "employment" &&
			(row.recordKind === "payment" ||
				row.coverageStart === null ||
				row.coverageEnd === null ||
				row.coverageScope === null)
		) {
			throw new Error("Employment income record has invalid coverage");
		}
		return {
			id: row.id,
			taxProfileId: row.taxProfileId,
			sourceDocumentId: row.sourceDocumentId,
			incomeType: row.incomeType,
			activityClassificationSource: row.activityClassificationSource,
			source: row.source === "document" ? "document" : "manual",
			idempotencyKey: row.idempotencyKey,
			receivedAt: row.receivedAt,
			recordKind: row.recordKind,
			coverageStart: row.coverageStart,
			coverageEnd: row.coverageEnd,
			coverageScope: row.coverageScope,
			calculationDisposition: row.calculationDisposition,
			coveredByRecordId: row.coveredByRecordId,
			coverageResolutionReason: row.coverageResolutionReason,
			grossAmount: row.grossAmount,
			withheldTaxAmount: row.withheldTaxAmount,
			currencyCode: "PEN",
			exchangeRate: null,
			grossAmountPen: row.grossAmountPen ?? row.grossAmount,
			withheldTaxAmountPen: row.withheldTaxAmountPen ?? row.withheldTaxAmount,
			payerName: row.payerName,
			payerTaxId: row.payerTaxId,
			status: "confirmed",
			notes: row.notes,
			deletedAt: row.deletedAt,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
