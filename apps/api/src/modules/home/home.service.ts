import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { DocumentsService } from "../documents/documents.service";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import { TaxStatusService } from "../tax-status/tax-status.service";
import type { CurrentTaxStatus } from "../tax-status/tax-status.types";
import type { HomePrimary, HomeResponse, HomeTaxSummary } from "./home.types";

@Injectable()
export class HomeService {
	constructor(
		@Inject(TaxProfileService)
		private readonly taxProfileService: TaxProfileService,
		@Inject(DocumentsService)
		private readonly documentsService: DocumentsService,
		@Inject(TaxStatusService)
		private readonly taxStatusService: TaxStatusService,
	) {}

	async getCurrentHome(userId: string): Promise<HomeResponse> {
		const current = await this.taxProfileService.getCurrentUser(userId);

		if (current.requiresOnboarding || !current.profile) {
			throw new HttpException(
				{
					code: "PROFILE_INCOMPLETE",
					message: "Completa tu perfil tributario antes de ver el inicio.",
				},
				HttpStatus.CONFLICT,
			);
		}

		const processedDocuments = await this.documentsService.countVisible(userId);
		const common = {
			taxYear: current.taxYear,
			summary: {
				processedDocuments,
				processingDocuments: 0,
				potentiallyRelevantAmount: null,
			},
			nextRelevantEvent: null,
			updatedAt: new Date().toISOString(),
		};

		if (current.profile.incomeMode !== "independent") {
			return {
				...common,
				status: "starting",
				primary: this.documentPrimary(processedDocuments),
				attention: { count: 0, nextItem: null },
				taxSummary: null,
			};
		}

		const taxStatus = await this.taxStatusService.getCurrent(userId);

		return {
			...common,
			status: taxStatus.status,
			primary: this.independentPrimary(taxStatus),
			attention: { count: taxStatus.openAttentionCount, nextItem: null },
			taxSummary: this.taxSummary(taxStatus),
		};
	}

	private independentPrimary(taxStatus: CurrentTaxStatus): HomePrimary {
		if (taxStatus.openAttentionCount > 0) {
			return {
				code: "REVIEW_FOURTH_INCOME",
				title: "Revisa un recibo por honorarios",
				description: "Confirma si corresponde a un ingreso tuyo.",
				action: "review_document",
			};
		}

		if (taxStatus.evaluation) {
			return taxStatus.status === "calculated"
				? {
						code: "VIEW_TAX_STATUS",
						title: "Estimación actualizada",
						description: "Con tus datos registrados hasta hoy.",
						action: "open_tax_status",
					}
				: {
						code: "VIEW_TAX_STATUS",
						title: "Aún faltan datos para estimar",
						description: "Revisa los ingresos registrados para 2026.",
						action: "open_tax_status",
					};
		}

		return {
			code: "ADD_FIRST_INCOME",
			title: "Registra tu primer ingreso",
			description: "Usaremos lo que efectivamente cobraste durante 2026.",
			action: "open_tax_income",
		};
	}

	private documentPrimary(processedDocuments: number): HomePrimary {
		const hasUploadedDocuments = processedDocuments > 0;

		return {
			code: hasUploadedDocuments ? "NOTHING_TO_REVIEW" : "ADD_FIRST_DOCUMENT",
			title: hasUploadedDocuments ? "Aún no hay nada que revisar." : "Añade tu primer comprobante",
			description: "Cuando llegue tu primer comprobante, Konti empieza a trabajar.",
			action: hasUploadedDocuments ? null : "open_capture",
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
}
