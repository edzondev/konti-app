import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseExecutor } from "../../database/database.types";
import type { MonthlyTaxCoverageState } from "../tax-engine/pe-2026/work-income-consolidator";
import { TaxEngineService } from "../tax-engine/tax-engine.service";
import type {
	AnyTaxEvaluationOutput,
	WorkIncomeTax2026Output,
} from "../tax-engine/tax-engine.types";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import {
	type CompletedTaxEvaluation,
	type CurrentTaxStatus,
	type EvaluateCurrentTaxStatusContext,
	type MonthlyApplicablePeriod,
	type MonthlyFourthCoverageReview,
	type ReviewedMonthlyPeriodState,
	TAX_STATUS_REPOSITORY,
	type TaxStatusRepositoryPort,
} from "./tax-status.types";

function elapsedPeriodInLima(now: Date): string | null {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
	}).formatToParts(now);
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	const year = Number(values.year);
	if (year < 2026) return null;
	if (year > 2026) return "2026-12";
	return `2026-${values.month}`;
}

function monthlyCoverageFromReviews(
	hasFourthIncome: boolean,
	throughPeriod: string | null,
	reviews: readonly MonthlyFourthCoverageReview[],
): MonthlyTaxCoverageState {
	if (!hasFourthIncome) return "not_applicable";
	if (throughPeriod === null || reviews.length === 0) return "unknown";

	const elapsedMonthCount = Number(throughPeriod.slice(5, 7));
	const confirmedPeriods = new Set(
		reviews
			.filter(
				(review) => review.coverage === "complete" && review.activityClassification !== "unknown",
			)
			.map((review) => review.period),
	);
	for (let month = 1; month <= elapsedMonthCount; month += 1) {
		const period = `2026-${String(month).padStart(2, "0")}`;
		if (!confirmedPeriods.has(period)) return "partial";
	}
	return "complete";
}

function applyMonthlyCoverage(
	output: WorkIncomeTax2026Output,
	monthlyCoverage: MonthlyTaxCoverageState,
): WorkIncomeTax2026Output {
	const coverage = { ...output.coverage, monthlyCoverage };
	return {
		...output,
		coverage,
		isDefinitive:
			coverage.incomeCoverage === "complete" &&
			coverage.deductionCoverage === "complete" &&
			(coverage.monthlyCoverage === "complete" || coverage.monthlyCoverage === "not_applicable") &&
			coverage.excludedFactors.length === 0,
	};
}

function isWorkIncomeOutput(output: AnyTaxEvaluationOutput): output is WorkIncomeTax2026Output {
	return "coverage" in output && "includedFourthIncomeCount" in output;
}

function monthlyPeriodsThrough(
	throughPeriod: string | null,
	states: readonly ReviewedMonthlyPeriodState[],
): MonthlyApplicablePeriod[] {
	if (throughPeriod === null) return [];
	const stateByPeriod = new Map(states.map((state) => [state.period, state.status]));
	const monthCount = Number(throughPeriod.slice(5, 7));
	return Array.from({ length: monthCount }, (_, index) => {
		const period = `2026-${String(index + 1).padStart(2, "0")}`;
		return { period, status: stateByPeriod.get(period) ?? "not_reviewed" };
	});
}

@Injectable()
export class TaxStatusService {
	constructor(
		@Inject(TAX_STATUS_REPOSITORY)
		private readonly repository: TaxStatusRepositoryPort,
		private readonly taxEngine: TaxEngineService,
		private readonly taxProfileService: TaxProfileService,
	) {}

	async getCurrent(userId: string): Promise<CurrentTaxStatus> {
		const profile = await this.getIndependentProfile(userId);
		const throughPeriod = elapsedPeriodInLima(new Date());
		const hasMonthlyFourthScope =
			profile.incomeMode === "independent" || profile.incomeMode === "mixed";
		const [latestEvaluation, openAttentionCount, monthlyReviews, monthlyStates] = await Promise.all(
			[
				this.repository.findLatestCompleted(undefined, profile.id, 2026),
				this.repository.countOpenFourthIncomeAttention(undefined, profile.id),
				hasMonthlyFourthScope && throughPeriod
					? this.repository.listMonthlyFourthReviews(undefined, profile.id, 2026, throughPeriod)
					: Promise.resolve([]),
				hasMonthlyFourthScope && throughPeriod
					? this.repository.listMonthlyPeriodStates(undefined, profile.id, 2026, throughPeriod)
					: Promise.resolve([]),
			],
		);
		if (!latestEvaluation) {
			return this.toCurrentStatus(
				undefined,
				openAttentionCount,
				hasMonthlyFourthScope ? monthlyPeriodsThrough(throughPeriod, monthlyStates) : [],
			);
		}
		if (!isWorkIncomeOutput(latestEvaluation.outputSnapshot)) {
			return this.toCurrentStatus(
				latestEvaluation,
				openAttentionCount,
				hasMonthlyFourthScope ? monthlyPeriodsThrough(throughPeriod, monthlyStates) : [],
			);
		}
		const hasFourthIncome = latestEvaluation.outputSnapshot.includedFourthIncomeCount > 0;
		const monthlyCoverage = monthlyCoverageFromReviews(
			hasFourthIncome,
			throughPeriod,
			monthlyReviews,
		);
		const derivedEvaluation = {
			...latestEvaluation,
			outputSnapshot: applyMonthlyCoverage(latestEvaluation.outputSnapshot, monthlyCoverage),
		};
		return this.toCurrentStatus(
			derivedEvaluation,
			openAttentionCount,
			hasFourthIncome ? monthlyPeriodsThrough(throughPeriod, monthlyStates) : [],
		);
	}

	async getEvaluation(userId: string, evaluationId: string) {
		const profile = await this.getIndependentProfile(userId);
		const evaluation = await this.repository.getEvaluationOwned(
			undefined,
			profile.id,
			evaluationId,
		);

		if (!evaluation) {
			throw new NotFoundException({
				code: "TAX_EVALUATION_NOT_FOUND",
				message: "No se encontró la evaluación tributaria.",
			});
		}

		return evaluation;
	}

	async evaluateAndPersist(
		executor: DatabaseExecutor,
		context: EvaluateCurrentTaxStatusContext,
	): Promise<CurrentTaxStatus> {
		const throughPeriod = elapsedPeriodInLima(new Date());
		const incomeMode = context.incomeMode ?? "independent";
		const hasFourthScope = incomeMode === "independent" || incomeMode === "mixed";
		const hasEmploymentScope = incomeMode === "employment" || incomeMode === "mixed";
		const [
			incomes,
			employmentIncomes,
			deductions,
			confirmedAdvancePayments,
			previousEvaluation,
			monthlyReviews,
		] = await Promise.all([
			hasFourthScope
				? this.repository.listConfirmedFourthIncome(executor, context.taxProfileId, 2026)
				: Promise.resolve([]),
			hasEmploymentScope
				? this.repository.listConfirmedEmploymentIncome(executor, context.taxProfileId, 2026)
				: Promise.resolve([]),
			this.repository.listTaxDeductions(executor, context.taxProfileId, 2026),
			this.repository.getConfirmedAdvancePayments(executor, context.taxProfileId, 2026),
			this.repository.findLatestCompleted(executor, context.taxProfileId, 2026),
			!hasFourthScope || throughPeriod === null
				? Promise.resolve([])
				: this.repository.listMonthlyFourthReviews(
						executor,
						context.taxProfileId,
						2026,
						throughPeriod,
					),
		]);
		const monthlyCoverage = monthlyCoverageFromReviews(
			incomes.length > 0,
			throughPeriod,
			monthlyReviews,
		);
		const inputSnapshot = {
			taxYear: 2026 as const,
			jurisdictionCode: "PE" as const,
			currencyCode: "PEN" as const,
			fourthIncomes: incomes,
			employmentIncomes,
			deductionRecords: deductions,
			confirmedAdvancePayments,
		};
		const outputSnapshot = applyMonthlyCoverage(
			this.taxEngine.calculateWorkIncome2026(inputSnapshot),
			monthlyCoverage,
		);
		const evaluation = await this.repository.insertCompletedEvaluation(executor, {
			taxProfileId: context.taxProfileId,
			rulesetVersion: outputSnapshot.rulesetVersion,
			periodStart: "2026-01-01",
			periodEnd: "2026-12-31",
			triggeredBy: context.triggeredBy,
			inputSnapshot,
			outputSnapshot,
			supersedesId: previousEvaluation?.id ?? null,
		});
		const [openAttentionCount, monthlyStates] = await Promise.all([
			this.repository.countOpenFourthIncomeAttention(executor, context.taxProfileId),
			hasFourthScope && incomes.length > 0 && throughPeriod
				? this.repository.listMonthlyPeriodStates(
						executor,
						context.taxProfileId,
						2026,
						throughPeriod,
					)
				: Promise.resolve([]),
		]);

		return this.toCurrentStatus(
			evaluation,
			openAttentionCount,
			hasFourthScope ? monthlyPeriodsThrough(throughPeriod, monthlyStates) : [],
		);
	}

	private async getIndependentProfile(userId: string) {
		const current = await this.taxProfileService.getCurrentUser(userId);

		if (current.requiresOnboarding || !current.profile) {
			throw new ConflictException({
				code: "TAX_PROFILE_REQUIRED",
				message: "Completa tu perfil tributario para continuar.",
			});
		}

		if (current.taxYear !== 2026 || current.profile.taxYear !== 2026) {
			throw new ConflictException({
				code: "TAX_YEAR_NOT_SUPPORTED",
				message: "Este cálculo solo está disponible para el año 2026.",
			});
		}

		if (
			current.profile.incomeMode !== "independent" &&
			current.profile.incomeMode !== "employment" &&
			current.profile.incomeMode !== "mixed"
		) {
			throw new ConflictException({
				code: "TAX_PROFILE_MODE_NOT_SUPPORTED",
				message: "Este cálculo está disponible para ingresos independientes.",
			});
		}

		return current.profile;
	}

	private toCurrentStatus(
		evaluation: CompletedTaxEvaluation | undefined,
		openAttentionCount: number,
		monthlyPeriods: readonly MonthlyApplicablePeriod[],
	): CurrentTaxStatus {
		return {
			status:
				openAttentionCount > 0
					? "attention_required"
					: (evaluation?.outputSnapshot.status ?? "insufficient_data"),
			taxYear: 2026,
			evaluation: evaluation
				? {
						id: evaluation.id,
						calculationKind:
							"employmentIncomes" in evaluation.inputSnapshot ||
							"deductionRecords" in evaluation.inputSnapshot
								? "work_income"
								: "fourth_category",
						rulesetVersion: evaluation.rulesetVersion,
						calculatedAt: evaluation.completedAt.toISOString(),
						output: evaluation.outputSnapshot,
					}
				: null,
			openAttentionCount,
			monthlyPeriods,
		};
	}
}
