import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { IncomeMode } from "../../database/schema/schema.types";
import { AttentionService } from "../attention/attention.service";
import type { HomeAttentionItem } from "../attention/attention.types";
import { DocumentsService } from "../documents/documents.service";
import type {
	AnyTaxEvaluationOutput,
	WorkIncomeTax2026Output,
} from "../tax-engine/tax-engine.types";
import { TaxPeriodService } from "../tax-period/tax-period.service";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { TaxStatusService } from "../tax-status/tax-status.service";
import type { CurrentTaxStatus } from "../tax-status/tax-status.types";
import type {
	HomeCoverage,
	HomeDeductionSummary,
	HomeDeductionVerificationStatus,
	HomePrimary,
	HomeResponse,
	HomeTaxSummary,
	HomeWorkIncomeSummary,
} from "./home.types";

function isWorkIncomeOutput(output: AnyTaxEvaluationOutput): output is WorkIncomeTax2026Output {
	return "grossFifthIncome" in output && "additionalDeductions" in output && "coverage" in output;
}

@Injectable()
export class HomeCurrentService {
	constructor(
		@Inject(TaxProfileService)
		private readonly taxProfileService: TaxProfileService,
		@Inject(DocumentsService)
		private readonly documentsService: DocumentsService,
		@Inject(TaxStatusService)
		private readonly taxStatusService: TaxStatusService,
		@Inject(AttentionService)
		private readonly attentionService: AttentionService,
		@Inject(TaxPeriodService)
		private readonly taxPeriodService: TaxPeriodService,
	) {}

	async getCurrentHome(userId: string): Promise<HomeResponse> {
		const current = await this.taxProfileService.getCurrentUser(userId);
		if (current.requiresOnboarding || !current.profile) {
			throw new ConflictException({
				code: "PROFILE_INCOMPLETE",
				message: "Completa tu perfil tributario antes de ver el inicio.",
			});
		}
		if (current.taxYear !== 2026 || current.profile.taxYear !== 2026) {
			throw new ConflictException({
				code: "TAX_YEAR_NOT_SUPPORTED",
				message: "Este resumen solo está disponible para el año 2026.",
			});
		}
		const incomeMode = current.profile.incomeMode;
		if (!incomeMode) {
			throw new ConflictException({
				code: "PROFILE_INCOMPLETE",
				message: "Completa tu perfil tributario antes de ver el inicio.",
			});
		}

		const [processedDocuments, taxStatus, attention, monthlyOutstandingCount] = await Promise.all([
			this.documentsService.countVisible(userId),
			this.taxStatusService.getCurrent(userId),
			this.attentionService.getOpenForUser(userId, 2026, 20),
			this.taxPeriodService.countOutstandingPeriods(userId, 2026),
		]);
		const output = taxStatus.evaluation?.output ?? null;
		const unreviewedPeriods = (taxStatus.monthlyPeriods ?? []).filter(
			(period) => period.status === "not_reviewed",
		);
		const syntheticMonthlyAttention: HomeAttentionItem | null = unreviewedPeriods[0]
			? {
					id: `monthly-gap:${unreviewedPeriods[0].period}`,
					itemType: "review_monthly_fourth",
					title: "Revisa tu mes de cuarta",
					description: "Confirma los datos registrados para preparar el resumen de este mes.",
					action: { kind: "review_monthly_fourth", period: unreviewedPeriods[0].period },
				}
			: null;
		const nextAttention = attention.nextItem ?? syntheticMonthlyAttention;
		const actionableCount = attention.count + unreviewedPeriods.length;

		return {
			status: actionableCount > 0 ? "attention_required" : taxStatus.status,
			taxYear: 2026,
			primary: this.primary(taxStatus, nextAttention, incomeMode),
			attention: { count: actionableCount, nextItem: nextAttention },
			taxSummary: this.taxSummary(taxStatus),
			workIncome: output ? this.workIncome(output) : null,
			deductions: output && isWorkIncomeOutput(output) ? this.deductions(output) : null,
			coverage: output && isWorkIncomeOutput(output) ? this.coverage(output) : null,
			monthlyOutstandingCount: monthlyOutstandingCount + unreviewedPeriods.length,
			summary: {
				processedDocuments,
				processingDocuments: 0,
				potentiallyRelevantAmount: null,
			},
			nextRelevantEvent: null,
			updatedAt: new Date().toISOString(),
		};
	}

	private primary(
		taxStatus: CurrentTaxStatus,
		nextItem: HomeAttentionItem | null,
		incomeMode: IncomeMode,
	): HomePrimary {
		if (nextItem) {
			return {
				code: "VIEW_TAX_STATUS",
				title: nextItem.title,
				description: nextItem.description,
				action: nextItem.action,
			};
		}

		if (taxStatus.status === "insufficient_data") {
			return {
				code: "ADD_FIRST_INCOME",
				title: "Completa tus ingresos",
				description: "Registra un ingreso para preparar tu estimación con datos confirmados.",
				action: { kind: "open_tax_income", incomeMode },
			};
		}

		if (taxStatus.evaluation) {
			return {
				code: "VIEW_TAX_STATUS",
				title: "Estimación actualizada",
				description: "Con tus datos registrados hasta hoy.",
				action: "open_tax_status",
			};
		}

		return {
			code: "ADD_FIRST_INCOME",
			title: "Registra tu primer ingreso",
			description: "Usaremos únicamente los datos que confirmes en Konti.",
			action: { kind: "open_tax_income", incomeMode },
		};
	}

	private taxSummary(taxStatus: CurrentTaxStatus): HomeTaxSummary | null {
		const evaluation = taxStatus.evaluation;
		if (!evaluation) return null;
		return {
			evaluationId: evaluation.id,
			calculatedAt: evaluation.calculatedAt,
			grossFourthIncome: evaluation.output.grossFourthIncome,
			calculatedTaxBeforeAdditionalDeductions:
				evaluation.output.calculatedTaxBeforeAdditionalDeductions,
			registeredWithholdings: evaluation.output.registeredWithholdings,
			differenceAfterRegisteredWithholdings:
				evaluation.output.differenceAfterRegisteredWithholdings,
			includedIncomeCount: evaluation.output.includedIncomeCount,
		};
	}

	private workIncome(output: AnyTaxEvaluationOutput): HomeWorkIncomeSummary {
		return {
			fourthGrossAmount: output.grossFourthIncome,
			employmentGrossAmount: isWorkIncomeOutput(output) ? output.grossFifthIncome : null,
		};
	}

	private deductions(output: WorkIncomeTax2026Output): HomeDeductionSummary {
		const includedStatuses = new Set<HomeDeductionVerificationStatus>();
		let unknownCount = 0;
		for (const decision of output.additionalDeductions.decisions) {
			if (decision.verificationStatus === "unknown") unknownCount += 1;
			if (
				decision.disposition === "included" &&
				decision.verificationStatus !== "unknown" &&
				!includedStatuses.has(decision.verificationStatus)
			) {
				includedStatuses.add(decision.verificationStatus);
			}
		}
		const includedVerificationStatuses = (
			["user_confirmed", "evidence_attached", "system_verified"] as const
		).filter((status) => includedStatuses.has(status));
		return {
			includedAmount: output.additionalDeductions.includedAdditionalDeduction,
			potentialAmount: output.additionalDeductions.potentialAmountBeforeCap,
			unknownCount,
			includedVerificationStatuses,
		};
	}

	private coverage(output: WorkIncomeTax2026Output): HomeCoverage {
		return {
			incomeCoverage: output.coverage.incomeCoverage,
			deductionCoverage: output.coverage.deductionCoverage,
			monthlyCoverage: output.coverage.monthlyCoverage,
			excludedFactors: output.coverage.excludedFactors,
		};
	}
}
