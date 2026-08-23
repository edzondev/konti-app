import type { DatabaseExecutor } from "../../database/database.types";
import type {
	IncomeMode,
	MonthlyFourthActivityClassification,
	MonthlyFourthCoverage,
} from "../../database/schema/schema.types";
import type { MonthlyFourthStatus } from "../monthly-fourth/monthly-fourth.types";
import type { TaxDeductionRecord } from "../tax-deductions/tax-deduction.types";
import type { EmploymentIncome2026 } from "../tax-engine/pe-2026/fifth-category.rules";
import type {
	AnyTaxEvaluationInput,
	AnyTaxEvaluationOutput,
	FourthCategory2026Income,
} from "../tax-engine/tax-engine.types";

export const TAX_STATUS_REPOSITORY = Symbol("TAX_STATUS_REPOSITORY");

export type MonthlyFourthCoverageReview = {
	period: string;
	coverage: MonthlyFourthCoverage;
	activityClassification: MonthlyFourthActivityClassification;
};

export type ReviewedMonthlyPeriodState = {
	period: string;
	status: MonthlyFourthStatus;
};

export type MonthlyApplicablePeriod = {
	period: string;
	status: MonthlyFourthStatus | "not_reviewed";
};

export type CompletedTaxEvaluation = {
	id: string;
	taxProfileId: string;
	evaluationType: "current_status";
	status: "completed";
	rulesetVersion: string;
	periodStart: string | null;
	periodEnd: string | null;
	triggeredBy: string;
	inputSnapshot: AnyTaxEvaluationInput;
	outputSnapshot: AnyTaxEvaluationOutput;
	supersedesId: string | null;
	completedAt: Date;
	createdAt: Date;
};

export type InsertCompletedTaxEvaluation = {
	taxProfileId: string;
	rulesetVersion: "pe-2026.1.0" | "pe-2026.2.0";
	periodStart: string | null;
	periodEnd: string | null;
	triggeredBy: string;
	inputSnapshot: AnyTaxEvaluationInput;
	outputSnapshot: AnyTaxEvaluationOutput;
	supersedesId: string | null;
};

export type EvaluateCurrentTaxStatusContext = {
	taxProfileId: string;
	taxYear: 2026;
	incomeMode?: IncomeMode | null;
	triggeredBy:
		| "tax_income_created"
		| "tax_income_updated"
		| "tax_income_deleted"
		| "document_income_confirmed"
		| "tax_deduction_created"
		| "tax_deduction_updated"
		| "tax_deduction_deleted"
		| "document_deduction_confirmed"
		| "tax_period_reviewed"
		| "tax_suspension_recorded"
		| "tax_filing_recorded"
		| "tax_payment_recorded";
};

export type CurrentTaxStatus = {
	status: "calculated" | "attention_required" | "insufficient_data";
	taxYear: 2026;
	evaluation: {
		id: string;
		calculationKind: "fourth_category" | "work_income";
		rulesetVersion: string;
		calculatedAt: string;
		output: AnyTaxEvaluationOutput;
	} | null;
	openAttentionCount: number;
	monthlyPeriods: readonly MonthlyApplicablePeriod[];
};

export interface TaxStatusRepositoryPort {
	listConfirmedFourthIncome(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<FourthCategory2026Income[]>;
	listConfirmedEmploymentIncome(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<EmploymentIncome2026[]>;
	listTaxDeductions(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<TaxDeductionRecord[]>;
	getConfirmedAdvancePayments(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
	): Promise<string>;
	listMonthlyFourthReviews(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
		throughPeriod: string,
	): Promise<MonthlyFourthCoverageReview[]>;
	listMonthlyPeriodStates(
		executor: DatabaseExecutor | undefined,
		taxProfileId: string,
		taxYear: 2026,
		throughPeriod: string,
	): Promise<ReviewedMonthlyPeriodState[]>;
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
