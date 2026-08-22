import type { DatabaseExecutor } from "../../database/database.types";
import type {
	FourthCategory2026Income,
	FourthCategory2026Input,
	FourthCategory2026Output,
} from "../tax-engine/tax-engine.types";

export const TAX_STATUS_REPOSITORY = Symbol("TAX_STATUS_REPOSITORY");

export type CompletedTaxEvaluation = {
	id: string;
	taxProfileId: string;
	evaluationType: "current_status";
	status: "completed";
	rulesetVersion: string;
	periodStart: string | null;
	periodEnd: string | null;
	triggeredBy: string;
	inputSnapshot: FourthCategory2026Input;
	outputSnapshot: FourthCategory2026Output;
	supersedesId: string | null;
	completedAt: Date;
	createdAt: Date;
};

export type InsertCompletedTaxEvaluation = Omit<
	CompletedTaxEvaluation,
	"id" | "evaluationType" | "status" | "completedAt" | "createdAt"
>;

export type EvaluateCurrentTaxStatusContext = {
	taxProfileId: string;
	taxYear: 2026;
	triggeredBy:
		| "tax_income_created"
		| "tax_income_updated"
		| "tax_income_deleted"
		| "document_income_confirmed";
};

export type CurrentTaxStatus = {
	status: "calculated" | "attention_required" | "insufficient_data";
	taxYear: 2026;
	evaluation: {
		id: string;
		rulesetVersion: string;
		calculatedAt: string;
		output: FourthCategory2026Output;
	} | null;
	openAttentionCount: number;
};

export interface TaxStatusRepositoryPort {
	listConfirmedFourthIncome(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<FourthCategory2026Income[]>;
	findLatestCompleted(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<CompletedTaxEvaluation | undefined>;
	insertCompletedEvaluation(
		executor: DatabaseExecutor,
		values: InsertCompletedTaxEvaluation,
	): Promise<CompletedTaxEvaluation>;
	countOpenFourthIncomeAttention(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
	): Promise<number>;
	getEvaluationOwned(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		evaluationId: string,
	): Promise<CompletedTaxEvaluation | undefined>;
}
