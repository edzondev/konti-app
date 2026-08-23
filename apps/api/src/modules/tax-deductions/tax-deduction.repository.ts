import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, isNull } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import {
	attentionItems,
	documentProcessingRuns,
	documents,
	taxDeductionRecords,
	taxProfiles,
} from "../../database/schema";
import type {
	CanonicalTaxDeductionInput,
	InsertTaxDeductionValues,
	StoredTaxDeductionRecord,
	TaxDeductionRepositoryPort,
} from "./tax-deduction.persistence.types";
import type { DeductionAttentionReason } from "./tax-deduction.types";

@Injectable()
export class TaxDeductionRepository implements TaxDeductionRepositoryPort {
	constructor(@Inject(DATABASE) private readonly db: Database) {}

	async lockTaxProfile(executor: DatabaseExecutor, taxProfileId: string) {
		const [profile] = await executor
			.select({ id: taxProfiles.id })
			.from(taxProfiles)
			.where(eq(taxProfiles.id, taxProfileId))
			.limit(1)
			.for("update");
		if (!profile) throw new Error("Tax profile could not be locked for deduction evaluation");
	}

	async findByIdempotencyKey(executor: DatabaseExecutor, taxProfileId: string, key: string) {
		const [row] = await executor
			.select()
			.from(taxDeductionRecords)
			.where(
				and(
					eq(taxDeductionRecords.taxProfileId, taxProfileId),
					eq(taxDeductionRecords.idempotencyKey, key),
				),
			)
			.limit(1);
		return row ? this.toRecord(row) : undefined;
	}

	async findActiveBySourceDocument(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	) {
		const [row] = await executor
			.select()
			.from(taxDeductionRecords)
			.where(
				and(
					eq(taxDeductionRecords.taxProfileId, taxProfileId),
					eq(taxDeductionRecords.sourceDocumentId, documentId),
					isNull(taxDeductionRecords.deletedAt),
				),
			)
			.limit(1);
		return row ? this.toRecord(row) : undefined;
	}

	async getDocumentForUpdate(executor: DatabaseExecutor, taxProfileId: string, documentId: string) {
		const [document] = await executor
			.select({
				id: documents.id,
				taxProfileId: documents.taxProfileId,
				status: documents.status,
				documentType: documents.documentType,
				currencyCode: documents.currencyCode,
			})
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
		return document;
	}

	async insert(executor: DatabaseExecutor, values: InsertTaxDeductionValues) {
		const [row] = await executor
			.insert(taxDeductionRecords)
			.values(this.toInsert(values))
			.onConflictDoNothing()
			.returning();
		return row ? this.toRecord(row) : undefined;
	}

	async getOwned(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		recordId: string,
		forUpdate = false,
	) {
		const database = executor ?? this.db;
		const query = database
			.select()
			.from(taxDeductionRecords)
			.where(this.ownedVisible(taxProfileId, recordId))
			.limit(1);
		const rows = forUpdate ? await query.for("update") : await query;
		return rows[0] ? this.toRecord(rows[0]) : undefined;
	}

	async listVisible(executor: DatabaseExecutor | undefined, taxProfileId: string) {
		const database = executor ?? this.db;
		const rows = await database
			.select()
			.from(taxDeductionRecords)
			.where(
				and(
					eq(taxDeductionRecords.taxProfileId, taxProfileId),
					isNull(taxDeductionRecords.deletedAt),
				),
			)
			.orderBy(desc(taxDeductionRecords.expenseDate), desc(taxDeductionRecords.createdAt));
		return rows.map((row) => this.toRecord(row));
	}

	async updateOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		input: CanonicalTaxDeductionInput,
		eligibleBase: string,
		attentionReasons: readonly string[],
	) {
		const [row] = await executor
			.update(taxDeductionRecords)
			.set({
				...this.categoryFields(input),
				category: input.category,
				expenseDate: input.expenseDate,
				grossAmount: input.grossAmount,
				eligibleBase,
				requirements: [...input.requirements],
				verificationStatus: input.verificationStatus,
				calculationStatus: input.calculationStatus,
				attentionReasons: attentionReasons as DeductionAttentionReason[],
				notes: input.notes ?? null,
			})
			.where(this.ownedVisible(taxProfileId, recordId))
			.returning();
		return row ? this.toRecord(row) : undefined;
	}

	async softDeleteOwned(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		deletedAt: Date,
	) {
		const [row] = await executor
			.update(taxDeductionRecords)
			.set({ deletedAt })
			.where(this.ownedVisible(taxProfileId, recordId))
			.returning();
		return row ? this.toRecord(row) : undefined;
	}

	async syncAttention(
		executor: DatabaseExecutor,
		taxProfileId: string,
		recordId: string,
		documentId: string | null,
		reasons: readonly string[],
	) {
		const deduplicationKey = `tax-deduction:${recordId}`;
		if (reasons.length === 0) {
			await executor
				.update(attentionItems)
				.set({ status: "resolved", resolvedAt: new Date() })
				.where(
					and(
						eq(attentionItems.taxProfileId, taxProfileId),
						eq(attentionItems.deduplicationKey, deduplicationKey),
						eq(attentionItems.status, "open"),
					),
				);
			return;
		}
		await executor
			.insert(attentionItems)
			.values({
				taxProfileId,
				documentId,
				source: "tax_engine",
				itemType: "review_tax_deduction",
				status: "open",
				priority: "normal",
				title: "Revisa un gasto deducible",
				message: "Falta confirmar información antes de incluir este gasto en tu estimación.",
				actionType: "review_tax_deduction",
				actionPayload: { recordId, reasons: [...reasons] },
				resolution: null,
				deduplicationKey,
				resolvedAt: null,
			})
			.onConflictDoUpdate({
				target: [attentionItems.taxProfileId, attentionItems.deduplicationKey],
				set: {
					status: "open",
					documentId,
					actionPayload: { recordId, reasons: [...reasons] },
					resolution: null,
					resolvedAt: null,
				},
			});
	}

	async storeDniIdentity(
		executor: DatabaseExecutor,
		taxProfileId: string,
		blindIndex: string,
		last4: string,
	) {
		await executor
			.update(taxProfiles)
			.set({ deductionDniBlindIndex: blindIndex, deductionDniLast4: last4 })
			.where(eq(taxProfiles.id, taxProfileId));
	}

	async getDniIdentityLast4(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
	): Promise<string | null> {
		const database = executor ?? this.db;
		const [profile] = await database
			.select({ last4: taxProfiles.deductionDniLast4 })
			.from(taxProfiles)
			.where(eq(taxProfiles.id, taxProfileId))
			.limit(1);
		return profile?.last4 ?? null;
	}

	async getDocumentCandidateSource(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		documentId: string,
	) {
		const database = executor ?? this.db;
		const [document] = await database
			.select({
				status: documents.status,
				documentType: documents.documentType,
				issueDate: documents.issueDate,
				currencyCode: documents.currencyCode,
			})
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
		const [run, existing, identity] = await Promise.all([
			database
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
				.limit(1),
			database
				.select({ id: taxDeductionRecords.id })
				.from(taxDeductionRecords)
				.where(
					and(
						eq(taxDeductionRecords.taxProfileId, taxProfileId),
						eq(taxDeductionRecords.sourceDocumentId, documentId),
						isNull(taxDeductionRecords.deletedAt),
					),
				)
				.limit(1),
			database
				.select({ blindIndex: taxProfiles.deductionDniBlindIndex })
				.from(taxProfiles)
				.where(eq(taxProfiles.id, taxProfileId))
				.limit(1),
		]);
		const normalizedResult = run[0]?.normalizedResult ?? {};
		const extractedBlindIndex = normalizedResult.consumerDocumentBlindIndex;
		const storedBlindIndex = identity[0]?.blindIndex;
		const consumerIdentityEvidence: "matches" | "does_not_match" | "unknown" =
			typeof extractedBlindIndex === "string" && typeof storedBlindIndex === "string"
				? extractedBlindIndex === storedBlindIndex
					? "matches"
					: "does_not_match"
				: "unknown";
		return {
			documentStatus: document.status,
			documentType: document.documentType,
			issueDate: document.issueDate,
			currencyCode: document.currencyCode,
			hasActiveDeduction: existing.length > 0,
			consumerIdentityEvidence,
			normalizedResult,
		};
	}

	private toInsert(values: InsertTaxDeductionValues): typeof taxDeductionRecords.$inferInsert {
		return {
			taxProfileId: values.taxProfileId,
			sourceDocumentId: values.sourceDocumentId,
			source: values.source,
			idempotencyKey: values.idempotencyKey,
			category: values.input.category,
			expenseDate: values.input.expenseDate,
			grossAmount: values.input.grossAmount,
			eligibleBase: values.eligibleBase,
			...this.categoryFields(values.input),
			requirements: [...values.input.requirements],
			verificationStatus: values.input.verificationStatus,
			calculationStatus: values.input.calculationStatus,
			attentionReasons: values.attentionReasons as DeductionAttentionReason[],
			currencyCode: "PEN",
			notes: values.input.notes ?? null,
		};
	}

	private categoryFields(input: CanonicalTaxDeductionInput) {
		return {
			insuranceReimbursementAmount:
				input.category === "medical_dental_services" ? input.insuranceReimbursementAmount : null,
			beneficiary: input.category === "medical_dental_services" ? input.beneficiary : null,
			fourthActivityType:
				input.category === "other_fourth_services" ? input.fourthActivityType : null,
			rentAttribution: input.category === "rent" ? input.attribution : null,
		};
	}

	private ownedVisible(taxProfileId: string, recordId: string) {
		return and(
			eq(taxDeductionRecords.id, recordId),
			eq(taxDeductionRecords.taxProfileId, taxProfileId),
			isNull(taxDeductionRecords.deletedAt),
		);
	}

	private toRecord(row: typeof taxDeductionRecords.$inferSelect): StoredTaxDeductionRecord {
		const base = {
			id: row.id,
			taxProfileId: row.taxProfileId,
			sourceDocumentId: row.sourceDocumentId,
			source: row.source,
			idempotencyKey: row.idempotencyKey,
			paidAt: row.expenseDate,
			grossAmountPen: row.grossAmount,
			eligibleBasePen: row.eligibleBase,
			verificationStatus: row.verificationStatus,
			calculationStatus: row.calculationStatus,
			requirements: row.requirements,
			notes: row.notes,
			deletedAt: row.deletedAt,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
		if (row.category === "medical_dental_services" && row.beneficiary) {
			return {
				...base,
				category: row.category,
				beneficiary: row.beneficiary,
				insuranceReimbursementAmountPen: row.insuranceReimbursementAmount,
			};
		}
		if (row.category === "other_fourth_services" && row.fourthActivityType) {
			return { ...base, category: row.category, fourthActivityType: row.fourthActivityType };
		}
		if (row.category === "rent" && row.rentAttribution) {
			return { ...base, category: row.category, attribution: row.rentAttribution };
		}
		if (row.category === "restaurants_hotels" || row.category === "household_worker_essalud") {
			return { ...base, category: row.category } as StoredTaxDeductionRecord;
		}
		throw new Error("Tax deduction record has an invalid category shape");
	}
}
