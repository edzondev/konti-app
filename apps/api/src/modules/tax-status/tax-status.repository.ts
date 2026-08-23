import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import {
	attentionItems,
	taxDeductionRecords,
	taxEvaluations,
	taxIncomeRecords,
	taxPaymentRecords,
	taxPeriodReviews,
} from "../../database/schema";
import type { TaxDeductionRecord } from "../tax-deductions/tax-deduction.types";
import type { EmploymentIncome2026 } from "../tax-engine/pe-2026/fifth-category.rules";
import type { FourthCategory2026Income } from "../tax-engine/tax-engine.types";
import type {
	CompletedTaxEvaluation,
	InsertCompletedTaxEvaluation,
	ReviewedMonthlyPeriodState,
	TaxStatusRepositoryPort,
} from "./tax-status.types";

const MONTHLY_STATUSES = new Set<ReviewedMonthlyPeriodState["status"]>([
	"insufficient_data",
	"no_action_detected",
	"action_likely_required",
	"awaiting_user_confirmation",
	"user_recorded_complete",
]);

@Injectable()
export class TaxStatusRepository implements TaxStatusRepositoryPort {
	constructor(
		@Inject(DATABASE)
		private readonly db: Database,
	) {}

	async listConfirmedFourthIncome(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
	): Promise<FourthCategory2026Income[]> {
		const database = executor ?? this.db;
		const rows = await database
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
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNull(taxIncomeRecords.deletedAt),
					isNotNull(taxIncomeRecords.grossAmountPen),
					isNotNull(taxIncomeRecords.withheldTaxAmountPen),
				),
			);

		return rows
			.filter(
				(row): row is typeof row & { receivedAt: string } =>
					row.receivedAt !== null &&
					row.receivedAt >= "2026-01-01" &&
					row.receivedAt <= "2026-12-31",
			)
			.map((row) => ({
				id: row.id,
				activityType: row.activityType as FourthCategory2026Income["activityType"],
				receivedAt: row.receivedAt,
				grossAmountPen: row.grossAmountPen as string,
				withheldTaxAmountPen: row.withheldTaxAmountPen as string,
			}));
	}

	async listConfirmedEmploymentIncome(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
	): Promise<EmploymentIncome2026[]> {
		const database = executor ?? this.db;
		const rows = await database
			.select({
				id: taxIncomeRecords.id,
				recordKind: taxIncomeRecords.recordKind,
				coverageStart: taxIncomeRecords.coverageStart,
				coverageEnd: taxIncomeRecords.coverageEnd,
				coverageScope: taxIncomeRecords.coverageScope,
				grossAmountPen: taxIncomeRecords.grossAmountPen,
				withheldTaxAmountPen: taxIncomeRecords.withheldTaxAmountPen,
				calculationDisposition: taxIncomeRecords.calculationDisposition,
				payerTaxId: taxIncomeRecords.payerTaxId,
				payerName: taxIncomeRecords.payerName,
			})
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.incomeType, "employment"),
					eq(taxIncomeRecords.status, "confirmed"),
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNull(taxIncomeRecords.deletedAt),
					isNotNull(taxIncomeRecords.coverageStart),
					isNotNull(taxIncomeRecords.coverageEnd),
					isNotNull(taxIncomeRecords.grossAmountPen),
					isNotNull(taxIncomeRecords.withheldTaxAmountPen),
				),
			);

		return rows
			.filter(
				(
					row,
				): row is typeof row & {
					coverageStart: string;
					coverageEnd: string;
					grossAmountPen: string;
					withheldTaxAmountPen: string;
				} =>
					row.coverageStart !== null &&
					row.coverageEnd !== null &&
					row.grossAmountPen !== null &&
					row.withheldTaxAmountPen !== null &&
					row.coverageStart >= "2026-01-01" &&
					row.coverageEnd <= "2026-12-31",
			)
			.map((row) => ({
				id: row.id,
				recordKind: row.recordKind as "period" | "year_to_date_snapshot",
				coverageStart: row.coverageStart,
				coverageEnd: row.coverageEnd,
				coverageScope: row.coverageScope as "single_payer" | "all_employers",
				grossAmountPen: row.grossAmountPen,
				withheldTaxAmountPen: row.withheldTaxAmountPen,
				calculationDisposition: row.calculationDisposition,
				payerTaxId: row.payerTaxId,
				payerName: row.payerName,
			}));
	}

	async listTaxDeductions(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
	): Promise<TaxDeductionRecord[]> {
		const database = executor ?? this.db;
		const rows = await database
			.select()
			.from(taxDeductionRecords)
			.where(
				and(
					eq(taxDeductionRecords.taxProfileId, taxProfileId),
					eq(taxDeductionRecords.currencyCode, "PEN"),
					isNull(taxDeductionRecords.deletedAt),
				),
			);

		return rows
			.filter((row) => row.expenseDate >= "2026-01-01" && row.expenseDate <= "2026-12-31")
			.map((row): TaxDeductionRecord => {
				const common = {
					id: row.id,
					paidAt: row.expenseDate,
					grossAmountPen: row.grossAmount,
					verificationStatus: row.verificationStatus,
					calculationStatus: row.calculationStatus,
					requirements: row.requirements,
				};
				if (row.category === "medical_dental_services" && row.beneficiary) {
					return {
						...common,
						category: row.category,
						beneficiary: row.beneficiary,
						insuranceReimbursementAmountPen: row.insuranceReimbursementAmount,
					};
				}
				if (row.category === "other_fourth_services" && row.fourthActivityType) {
					return { ...common, category: row.category, fourthActivityType: row.fourthActivityType };
				}
				if (row.category === "rent" && row.rentAttribution) {
					return { ...common, category: row.category, attribution: row.rentAttribution };
				}
				if (row.category === "restaurants_hotels" || row.category === "household_worker_essalud") {
					return { ...common, category: row.category };
				}
				throw new Error("Tax deduction record has an invalid category shape");
			});
	}

	async getConfirmedAdvancePayments(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
	): Promise<string> {
		const database = executor ?? this.db;
		const rows = await database
			.select({ amountPen: taxPaymentRecords.amountPen })
			.from(taxPaymentRecords)
			.where(
				and(
					eq(taxPaymentRecords.taxProfileId, taxProfileId),
					eq(taxPaymentRecords.answer, "yes"),
					isNull(taxPaymentRecords.deletedAt),
					isNotNull(taxPaymentRecords.amountPen),
				),
			);
		return rows
			.reduce((total, row) => total.plus(row.amountPen ?? "0"), new Decimal(0))
			.toDecimalPlaces(2)
			.toFixed(2);
	}

	async listMonthlyFourthReviews(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
		throughPeriod: string,
	) {
		const database = executor ?? this.db;
		return database
			.select({
				period: taxPeriodReviews.period,
				coverage: taxPeriodReviews.coverage,
				activityClassification: taxPeriodReviews.activityClassification,
			})
			.from(taxPeriodReviews)
			.where(
				and(
					eq(taxPeriodReviews.taxProfileId, taxProfileId),
					lte(taxPeriodReviews.period, throughPeriod),
					isNull(taxPeriodReviews.deletedAt),
				),
			);
	}

	async listMonthlyPeriodStates(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
		throughPeriod: string,
	): Promise<ReviewedMonthlyPeriodState[]> {
		const database = executor ?? this.db;
		const rows = await database
			.select({
				periodStart: taxEvaluations.periodStart,
				outputSnapshot: taxEvaluations.outputSnapshot,
			})
			.from(taxEvaluations)
			.where(
				and(
					eq(taxEvaluations.taxProfileId, taxProfileId),
					eq(taxEvaluations.evaluationType, "period_review"),
					eq(taxEvaluations.status, "completed"),
					gte(taxEvaluations.periodStart, "2026-01-01"),
					lte(taxEvaluations.periodStart, `${throughPeriod}-31`),
					isNotNull(taxEvaluations.completedAt),
				),
			)
			.orderBy(desc(taxEvaluations.createdAt), desc(taxEvaluations.id));
		const seen = new Set<string>();
		const states: ReviewedMonthlyPeriodState[] = [];
		for (const row of rows) {
			const period = row.periodStart?.slice(0, 7);
			const status = row.outputSnapshot?.status;
			if (
				!period ||
				seen.has(period) ||
				typeof status !== "string" ||
				!MONTHLY_STATUSES.has(status as ReviewedMonthlyPeriodState["status"])
			) {
				continue;
			}
			seen.add(period);
			states.push({ period, status: status as ReviewedMonthlyPeriodState["status"] });
		}
		return states.sort((left, right) => left.period.localeCompare(right.period));
	}

	async findLatestCompleted(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		_taxYear: 2026,
	): Promise<CompletedTaxEvaluation | undefined> {
		const database = executor ?? this.db;
		const [evaluation] = await database
			.select()
			.from(taxEvaluations)
			.where(
				and(
					eq(taxEvaluations.taxProfileId, taxProfileId),
					eq(taxEvaluations.evaluationType, "current_status"),
					eq(taxEvaluations.status, "completed"),
					eq(taxEvaluations.periodStart, "2026-01-01"),
					isNotNull(taxEvaluations.completedAt),
				),
			)
			.orderBy(desc(taxEvaluations.createdAt), desc(taxEvaluations.id))
			.limit(1);

		return evaluation ? this.toCompletedEvaluation(evaluation) : undefined;
	}

	async insertCompletedEvaluation(
		executor: DatabaseExecutor,
		values: InsertCompletedTaxEvaluation,
	): Promise<CompletedTaxEvaluation> {
		const now = new Date();
		const [evaluation] = await executor
			.insert(taxEvaluations)
			.values({
				taxProfileId: values.taxProfileId,
				evaluationType: "current_status",
				status: "completed",
				rulesetVersion: values.rulesetVersion,
				periodStart: values.periodStart,
				periodEnd: values.periodEnd,
				triggeredBy: values.triggeredBy,
				inputSnapshot: values.inputSnapshot as unknown as Record<string, unknown>,
				outputSnapshot: values.outputSnapshot as unknown as Record<string, unknown>,
				supersedesId: values.supersedesId,
				completedAt: now,
			})
			.returning();

		if (!evaluation) {
			throw new Error("Tax evaluation could not be persisted");
		}

		return this.toCompletedEvaluation(evaluation);
	}

	async countOpenFourthIncomeAttention(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
	): Promise<number> {
		const database = executor ?? this.db;
		const [result] = await database
			.select({ value: count() })
			.from(attentionItems)
			.where(
				and(
					eq(attentionItems.taxProfileId, taxProfileId),
					inArray(attentionItems.itemType, [
						"confirm_fourth_income",
						"resolve_employment_coverage",
						"review_tax_deduction",
						"review_monthly_fourth",
					]),
					eq(attentionItems.status, "open"),
				),
			);

		return result?.value ?? 0;
	}

	async getEvaluationOwned(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		evaluationId: string,
	): Promise<CompletedTaxEvaluation | undefined> {
		const database = executor ?? this.db;
		const [evaluation] = await database
			.select()
			.from(taxEvaluations)
			.where(
				and(
					eq(taxEvaluations.id, evaluationId),
					eq(taxEvaluations.taxProfileId, taxProfileId),
					eq(taxEvaluations.evaluationType, "current_status"),
					eq(taxEvaluations.status, "completed"),
					isNotNull(taxEvaluations.completedAt),
				),
			)
			.limit(1);

		return evaluation ? this.toCompletedEvaluation(evaluation) : undefined;
	}

	private toCompletedEvaluation(
		evaluation: typeof taxEvaluations.$inferSelect,
	): CompletedTaxEvaluation {
		if (!evaluation.completedAt) {
			throw new Error("Completed tax evaluation is missing completedAt");
		}

		return {
			id: evaluation.id,
			taxProfileId: evaluation.taxProfileId,
			evaluationType: "current_status",
			status: "completed",
			rulesetVersion: evaluation.rulesetVersion,
			periodStart: evaluation.periodStart,
			periodEnd: evaluation.periodEnd,
			triggeredBy: evaluation.triggeredBy,
			inputSnapshot: evaluation.inputSnapshot as CompletedTaxEvaluation["inputSnapshot"],
			outputSnapshot: evaluation.outputSnapshot as CompletedTaxEvaluation["outputSnapshot"],
			supersedesId: evaluation.supersedesId,
			completedAt: evaluation.completedAt,
			createdAt: evaluation.createdAt,
		};
	}
}
