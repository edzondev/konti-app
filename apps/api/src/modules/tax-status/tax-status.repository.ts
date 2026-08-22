import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { DATABASE } from "../../database/database.constants";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import { attentionItems, taxEvaluations, taxIncomeRecords } from "../../database/schema";
import type { FourthCategory2026Income } from "../tax-engine/tax-engine.types";
import type {
	CompletedTaxEvaluation,
	InsertCompletedTaxEvaluation,
	TaxStatusRepositoryPort,
} from "./tax-status.types";

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
				receivedAt: taxIncomeRecords.receivedAt,
				grossAmountPen: taxIncomeRecords.grossAmountPen,
				withheldTaxAmountPen: taxIncomeRecords.withheldTaxAmountPen,
			})
			.from(taxIncomeRecords)
			.where(
				and(
					eq(taxIncomeRecords.taxProfileId, taxProfileId),
					eq(taxIncomeRecords.incomeType, "independent_services"),
					eq(taxIncomeRecords.status, "confirmed"),
					eq(taxIncomeRecords.currencyCode, "PEN"),
					isNull(taxIncomeRecords.deletedAt),
					isNotNull(taxIncomeRecords.grossAmountPen),
					isNotNull(taxIncomeRecords.withheldTaxAmountPen),
				),
			);

		return rows
			.filter((row) => row.receivedAt >= "2026-01-01" && row.receivedAt <= "2026-12-31")
			.map((row) => ({
				id: row.id,
				receivedAt: row.receivedAt,
				grossAmountPen: row.grossAmountPen as string,
				withheldTaxAmountPen: row.withheldTaxAmountPen as string,
			}));
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
					eq(attentionItems.itemType, "confirm_fourth_income"),
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
