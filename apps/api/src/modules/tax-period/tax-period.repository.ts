import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import {
	attentionItems,
	documents,
	taxEvaluations,
	taxFilingRecords,
	taxFourthSuspensions,
	taxIncomeRecords,
	taxPaymentRecords,
	taxPeriodReviews,
	taxProfiles,
} from "../../database/schema";
import type {
	InsertPeriodEvaluation,
	MonthlyPeriodData,
	ReplaceTaxFiling,
	ReplaceTaxPayment,
	ReplaceTaxPeriodReview,
	ReplaceTaxSuspension,
	StoredTaxFiling,
	StoredTaxPayment,
	StoredTaxPeriodReview,
	StoredTaxSuspension,
	TaxPeriodRepositoryPort,
} from "./tax-period.types";

function periodBounds(period: string): { start: string; end: string } {
	const [year, month] = period.split("-").map(Number);
	return {
		start: `${period}-01`,
		end: new Date(Date.UTC(year ?? 0, month ?? 0, 0)).toISOString().slice(0, 10),
	};
}

function selectApplicableSuspension(
	rows: readonly StoredTaxSuspension[],
	period: string,
): StoredTaxSuspension | null {
	const { start, end } = periodBounds(period);
	const exactPeriod = rows
		.filter((row) => row.period === period)
		.sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0];
	if (exactPeriod) return exactPeriod;

	return (
		rows
			.filter(
				(row) =>
					row.answer === "yes" &&
					row.effectiveFrom !== null &&
					row.validThrough !== null &&
					row.effectiveFrom <= end &&
					row.validThrough >= start,
			)
			.sort((left, right) => {
				const effectiveOrder = (right.effectiveFrom ?? "").localeCompare(left.effectiveFrom ?? "");
				return effectiveOrder || right.updatedAt.getTime() - left.updatedAt.getTime();
			})[0] ?? null
	);
}

@Injectable()
export class TaxPeriodRepository implements TaxPeriodRepositoryPort {
	constructor(
		@Inject(DATABASE)
		private readonly db: Database,
	) {}

	async lockTaxProfile(executor: DatabaseExecutor, taxProfileId: string): Promise<void> {
		const [profile] = await executor
			.select({ id: taxProfiles.id })
			.from(taxProfiles)
			.where(eq(taxProfiles.id, taxProfileId))
			.limit(1)
			.for("update");
		if (!profile) throw new Error("Tax profile disappeared during monthly evaluation");
	}

	async getOwnedDocumentForUpdate(
		executor: DatabaseExecutor,
		taxProfileId: string,
		documentId: string,
	): Promise<{ id: string } | undefined> {
		const [document] = await executor
			.select({ id: documents.id })
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

	async findPeriodReviewByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxPeriodReview | undefined> {
		const [record] = await executor
			.select()
			.from(taxPeriodReviews)
			.where(
				and(
					eq(taxPeriodReviews.taxProfileId, taxProfileId),
					eq(taxPeriodReviews.idempotencyKey, idempotencyKey),
				),
			)
			.limit(1);
		return record;
	}

	async findSuspensionByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxSuspension | undefined> {
		const [record] = await executor
			.select()
			.from(taxFourthSuspensions)
			.where(
				and(
					eq(taxFourthSuspensions.taxProfileId, taxProfileId),
					eq(taxFourthSuspensions.idempotencyKey, idempotencyKey),
				),
			)
			.limit(1);
		return record;
	}

	async findFilingByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxFiling | undefined> {
		const [record] = await executor
			.select()
			.from(taxFilingRecords)
			.where(
				and(
					eq(taxFilingRecords.taxProfileId, taxProfileId),
					eq(taxFilingRecords.idempotencyKey, idempotencyKey),
				),
			)
			.limit(1);
		return record ? this.toStoredFiling(record) : undefined;
	}

	async findPaymentByIdempotencyKey(
		executor: DatabaseExecutor,
		taxProfileId: string,
		idempotencyKey: string,
	): Promise<StoredTaxPayment | undefined> {
		const [record] = await executor
			.select()
			.from(taxPaymentRecords)
			.where(
				and(
					eq(taxPaymentRecords.taxProfileId, taxProfileId),
					eq(taxPaymentRecords.idempotencyKey, idempotencyKey),
				),
			)
			.limit(1);
		return record;
	}

	async replacePeriodReview(
		executor: DatabaseExecutor,
		values: ReplaceTaxPeriodReview,
	): Promise<StoredTaxPeriodReview> {
		const now = new Date();
		await executor
			.update(taxPeriodReviews)
			.set({ deletedAt: now, updatedAt: now })
			.where(
				and(
					eq(taxPeriodReviews.taxProfileId, values.taxProfileId),
					eq(taxPeriodReviews.period, values.period),
					isNull(taxPeriodReviews.deletedAt),
				),
			);
		const [record] = await executor
			.insert(taxPeriodReviews)
			.values({ ...values, reviewedAt: now })
			.returning();
		if (!record) throw new Error("Tax period review could not be persisted");
		return record;
	}

	async replaceSuspension(
		executor: DatabaseExecutor,
		values: ReplaceTaxSuspension,
	): Promise<StoredTaxSuspension> {
		const now = new Date();
		await executor
			.update(taxFourthSuspensions)
			.set({ deletedAt: now, updatedAt: now })
			.where(
				and(
					eq(taxFourthSuspensions.taxProfileId, values.taxProfileId),
					eq(taxFourthSuspensions.period, values.input.period),
					isNull(taxFourthSuspensions.deletedAt),
				),
			);
		const [record] = await executor
			.insert(taxFourthSuspensions)
			.values({
				taxProfileId: values.taxProfileId,
				period: values.input.period,
				answer: values.input.answer,
				authorizationDate: values.input.authorizationDate,
				effectiveFrom: values.effectiveFrom,
				validThrough: values.validThrough,
				restartState: values.input.restartState,
				restartDate: values.input.restartDate,
				verificationScope: values.input.verificationScope,
				source: values.source,
				sourceDocumentId: values.input.sourceDocumentId,
				idempotencyKey: values.input.idempotencyKey,
			})
			.returning();
		if (!record) throw new Error("Tax suspension could not be persisted");
		return record;
	}

	async replaceFiling(
		executor: DatabaseExecutor,
		values: ReplaceTaxFiling,
	): Promise<StoredTaxFiling> {
		const now = new Date();
		await executor
			.update(taxFilingRecords)
			.set({ deletedAt: now, updatedAt: now })
			.where(
				and(
					eq(taxFilingRecords.taxProfileId, values.taxProfileId),
					eq(taxFilingRecords.period, values.input.period),
					isNull(taxFilingRecords.deletedAt),
				),
			);
		const [record] = await executor
			.insert(taxFilingRecords)
			.values({
				taxProfileId: values.taxProfileId,
				period: values.input.period,
				answer: values.input.answer,
				filedAt: values.input.filedAt,
				confirmationNumber: values.input.confirmationNumber,
				verificationScope: values.input.verificationScope,
				source: values.source,
				sourceDocumentId: values.input.sourceDocumentId,
				idempotencyKey: values.input.idempotencyKey,
			})
			.returning();
		if (!record) throw new Error("Tax filing could not be persisted");
		return this.toStoredFiling(record);
	}

	async replacePayment(
		executor: DatabaseExecutor,
		values: ReplaceTaxPayment,
	): Promise<StoredTaxPayment> {
		const now = new Date();
		await executor
			.update(taxPaymentRecords)
			.set({ deletedAt: now, updatedAt: now })
			.where(
				and(
					eq(taxPaymentRecords.taxProfileId, values.taxProfileId),
					eq(taxPaymentRecords.period, values.input.period),
					isNull(taxPaymentRecords.deletedAt),
				),
			);
		const [record] = await executor
			.insert(taxPaymentRecords)
			.values({
				taxProfileId: values.taxProfileId,
				period: values.input.period,
				answer: values.input.answer,
				amountPen: values.input.amountPen,
				paidAt: values.input.paidAt,
				confirmationCode: values.input.confirmationCode,
				verificationScope: values.input.verificationScope,
				source: values.source,
				sourceDocumentId: values.input.sourceDocumentId,
				idempotencyKey: values.input.idempotencyKey,
			})
			.returning();
		if (!record) throw new Error("Tax payment could not be persisted");
		return record;
	}

	async loadPeriodData(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		period: string,
	): Promise<MonthlyPeriodData> {
		const database = executor ?? this.db;
		const { start, end } = periodBounds(period);
		const [reviewRows, suspensionRows, filingRows, paymentRows, fourthRows, employmentRows] =
			await Promise.all([
				database
					.select()
					.from(taxPeriodReviews)
					.where(
						and(
							eq(taxPeriodReviews.taxProfileId, taxProfileId),
							eq(taxPeriodReviews.period, period),
							isNull(taxPeriodReviews.deletedAt),
						),
					)
					.limit(1),
				database
					.select()
					.from(taxFourthSuspensions)
					.where(
						and(
							eq(taxFourthSuspensions.taxProfileId, taxProfileId),
							isNull(taxFourthSuspensions.deletedAt),
						),
					),
				database
					.select()
					.from(taxFilingRecords)
					.where(
						and(
							eq(taxFilingRecords.taxProfileId, taxProfileId),
							eq(taxFilingRecords.period, period),
							isNull(taxFilingRecords.deletedAt),
						),
					)
					.limit(1),
				database
					.select()
					.from(taxPaymentRecords)
					.where(
						and(
							eq(taxPaymentRecords.taxProfileId, taxProfileId),
							eq(taxPaymentRecords.period, period),
							isNull(taxPaymentRecords.deletedAt),
						),
					)
					.limit(1),
				database
					.select({
						id: taxIncomeRecords.id,
						activityType: taxIncomeRecords.incomeType,
						receivedAt: taxIncomeRecords.receivedAt,
						grossAmountPen: taxIncomeRecords.grossAmountPen,
						withheldTaxAmountPen: taxIncomeRecords.withheldTaxAmountPen,
					})
					.from(taxIncomeRecords)
					.where(
						and(
							eq(taxIncomeRecords.taxProfileId, taxProfileId),
							inArray(taxIncomeRecords.incomeType, ["fourth_ordinary", "fourth_special"]),
							eq(taxIncomeRecords.status, "confirmed"),
							eq(taxIncomeRecords.calculationDisposition, "included"),
							eq(taxIncomeRecords.currencyCode, "PEN"),
							isNull(taxIncomeRecords.deletedAt),
							isNotNull(taxIncomeRecords.receivedAt),
							isNotNull(taxIncomeRecords.grossAmountPen),
							isNotNull(taxIncomeRecords.withheldTaxAmountPen),
							gte(taxIncomeRecords.receivedAt, start),
							lte(taxIncomeRecords.receivedAt, end),
						),
					),
				database
					.select({
						recordKind: taxIncomeRecords.recordKind,
						coverageStart: taxIncomeRecords.coverageStart,
						coverageEnd: taxIncomeRecords.coverageEnd,
						grossAmountPen: taxIncomeRecords.grossAmountPen,
					})
					.from(taxIncomeRecords)
					.where(
						and(
							eq(taxIncomeRecords.taxProfileId, taxProfileId),
							eq(taxIncomeRecords.incomeType, "employment"),
							eq(taxIncomeRecords.status, "confirmed"),
							eq(taxIncomeRecords.calculationDisposition, "included"),
							eq(taxIncomeRecords.currencyCode, "PEN"),
							isNull(taxIncomeRecords.deletedAt),
							isNotNull(taxIncomeRecords.coverageStart),
							isNotNull(taxIncomeRecords.coverageEnd),
							isNotNull(taxIncomeRecords.grossAmountPen),
							lte(taxIncomeRecords.coverageStart, end),
							gte(taxIncomeRecords.coverageEnd, start),
						),
					),
			]);

		const [pending] = await database
			.select({ value: count() })
			.from(attentionItems)
			.where(
				and(
					eq(attentionItems.taxProfileId, taxProfileId),
					eq(attentionItems.itemType, "confirm_fourth_income"),
					eq(attentionItems.status, "open"),
				),
			);
		const fifthGross = employmentRows.reduce((total, record) => {
			const isKnownMonthlyPeriod =
				record.recordKind === "period" &&
				record.coverageStart !== null &&
				record.coverageEnd !== null &&
				record.grossAmountPen !== null &&
				record.coverageStart >= start &&
				record.coverageEnd <= end;
			return isKnownMonthlyPeriod ? total.plus(record.grossAmountPen ?? "0") : total;
		}, new Decimal(0));
		const ambiguousEmploymentCount = employmentRows.filter(
			(record) =>
				record.recordKind !== "period" ||
				record.coverageStart === null ||
				record.coverageEnd === null ||
				record.coverageStart < start ||
				record.coverageEnd > end,
		).length;

		return {
			review: reviewRows[0] ?? null,
			suspension: selectApplicableSuspension(suspensionRows, period),
			filing: filingRows[0] ? this.toStoredFiling(filingRows[0]) : null,
			payment: paymentRows[0] ?? null,
			fourthIncomes: fourthRows.flatMap((record) =>
				record.receivedAt &&
				record.grossAmountPen &&
				record.withheldTaxAmountPen &&
				(record.activityType === "fourth_ordinary" || record.activityType === "fourth_special")
					? [
							{
								id: record.id,
								activityType: record.activityType,
								receivedAt: record.receivedAt,
								grossAmountPen: record.grossAmountPen,
								withheldTaxAmountPen: record.withheldTaxAmountPen,
							},
						]
					: [],
			),
			fifthGrossAmountPen: fifthGross.toDecimalPlaces(2).toFixed(2),
			pendingDocumentCount: (pending?.value ?? 0) + ambiguousEmploymentCount,
		};
	}

	async findLatestPeriodEvaluation(
		executor: DatabaseExecutor,
		taxProfileId: string,
		period: string,
	): Promise<{ id: string } | undefined> {
		const { start, end } = periodBounds(period);
		const [evaluation] = await executor
			.select({ id: taxEvaluations.id })
			.from(taxEvaluations)
			.where(
				and(
					eq(taxEvaluations.taxProfileId, taxProfileId),
					eq(taxEvaluations.evaluationType, "period_review"),
					eq(taxEvaluations.status, "completed"),
					eq(taxEvaluations.periodStart, start),
					eq(taxEvaluations.periodEnd, end),
				),
			)
			.orderBy(desc(taxEvaluations.createdAt), desc(taxEvaluations.id))
			.limit(1);
		return evaluation;
	}

	async insertPeriodEvaluation(
		executor: DatabaseExecutor,
		values: InsertPeriodEvaluation,
	): Promise<{ id: string }> {
		const { start, end } = periodBounds(values.period);
		const [evaluation] = await executor
			.insert(taxEvaluations)
			.values({
				taxProfileId: values.taxProfileId,
				evaluationType: "period_review",
				status: "completed",
				rulesetVersion: values.rulesetVersion,
				periodStart: start,
				periodEnd: end,
				triggeredBy: values.triggeredBy,
				inputSnapshot: values.inputSnapshot as unknown as Record<string, unknown>,
				outputSnapshot: values.outputSnapshot as unknown as Record<string, unknown>,
				supersedesId: values.supersedesId,
				completedAt: new Date(),
			})
			.returning({ id: taxEvaluations.id });
		if (!evaluation) throw new Error("Monthly tax evaluation could not be persisted");
		return evaluation;
	}

	async syncMonthlyAttention(
		executor: DatabaseExecutor,
		values: {
			taxProfileId: string;
			period: string;
			taxEvaluationId: string;
			status:
				| "insufficient_data"
				| "no_action_detected"
				| "action_likely_required"
				| "awaiting_user_confirmation"
				| "user_recorded_complete";
			reasons: readonly string[];
			open: boolean;
		},
	): Promise<void> {
		const now = new Date();
		const deduplicationKey = `monthly-fourth:${values.period}`;
		const title = values.open
			? values.status === "action_likely_required"
				? "Revisa tu declaración y pago del mes"
				: "Completa la revisión mensual de cuarta"
			: "Revisión mensual registrada";
		await executor
			.insert(attentionItems)
			.values({
				taxProfileId: values.taxProfileId,
				taxEvaluationId: values.taxEvaluationId,
				source: "tax_engine",
				itemType: "review_monthly_fourth",
				status: values.open ? "open" : "resolved",
				priority: values.status === "action_likely_required" ? "high" : "normal",
				title,
				message: "Konti resume tus datos registrados; no confirma cumplimiento ante SUNAT.",
				actionType: "review_monthly_fourth",
				actionPayload: { period: values.period, status: values.status, reasons: values.reasons },
				resolution: values.open ? null : { status: values.status },
				deduplicationKey,
				resolvedAt: values.open ? null : now,
			})
			.onConflictDoUpdate({
				target: [attentionItems.taxProfileId, attentionItems.deduplicationKey],
				set: {
					taxEvaluationId: values.taxEvaluationId,
					status: values.open ? "open" : "resolved",
					priority: values.status === "action_likely_required" ? "high" : "normal",
					title,
					message: "Konti resume tus datos registrados; no confirma cumplimiento ante SUNAT.",
					actionType: "review_monthly_fourth",
					actionPayload: { period: values.period, status: values.status, reasons: values.reasons },
					resolution: values.open ? null : { status: values.status },
					resolvedAt: values.open ? null : now,
					updatedAt: now,
				},
			});
	}

	async countOutstandingPeriods(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
	): Promise<number> {
		const database = executor ?? this.db;
		const [result] = await database
			.select({ value: count() })
			.from(attentionItems)
			.where(
				and(
					eq(attentionItems.taxProfileId, taxProfileId),
					eq(attentionItems.itemType, "review_monthly_fourth"),
					eq(attentionItems.status, "open"),
				),
			);
		return result?.value ?? 0;
	}

	private toStoredFiling(record: typeof taxFilingRecords.$inferSelect): StoredTaxFiling {
		return { ...record, formType: "virtual_616" };
	}
}
