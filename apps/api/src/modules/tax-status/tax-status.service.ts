import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { DatabaseExecutor } from "../../database/database.types";
import { TaxEngineService } from "../tax-engine/tax-engine.service";
import type { FourthCategory2026Input } from "../tax-engine/tax-engine.types";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import {
	type CompletedTaxEvaluation,
	type CurrentTaxStatus,
	type EvaluateCurrentTaxStatusContext,
	TAX_STATUS_REPOSITORY,
	type TaxStatusRepositoryPort,
} from "./tax-status.types";

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
		const [latestEvaluation, openAttentionCount] = await Promise.all([
			this.repository.findLatestCompleted(undefined, profile.id, 2026),
			this.repository.countOpenFourthIncomeAttention(undefined, profile.id),
		]);

		return this.toCurrentStatus(latestEvaluation, openAttentionCount);
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
		const [incomes, previousEvaluation] = await Promise.all([
			this.repository.listConfirmedFourthIncome(executor, context.taxProfileId, 2026),
			this.repository.findLatestCompleted(executor, context.taxProfileId, 2026),
		]);
		const inputSnapshot: FourthCategory2026Input = {
			taxYear: 2026,
			jurisdictionCode: "PE",
			currencyCode: "PEN",
			activity: "ordinary_independent_services",
			incomes,
		};
		const outputSnapshot = this.taxEngine.calculateFourthCategory2026(inputSnapshot);
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
		const openAttentionCount = await this.repository.countOpenFourthIncomeAttention(
			executor,
			context.taxProfileId,
		);

		return this.toCurrentStatus(evaluation, openAttentionCount);
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

		if (current.profile.incomeMode !== "independent") {
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
						rulesetVersion: evaluation.rulesetVersion,
						calculatedAt: evaluation.completedAt.toISOString(),
						output: evaluation.outputSnapshot,
					}
				: null,
			openAttentionCount,
		};
	}
}
