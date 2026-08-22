import { HttpStatus } from "@nestjs/common";
import type { DocumentsService } from "../documents/documents.service";
import { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { TaxStatusService } from "../tax-status/tax-status.service";
import { HomeService } from "./home.service";

const evaluation = {
	id: "evaluation-1",
	rulesetVersion: "pe-2026.1.0",
	calculatedAt: "2026-08-21T15:00:00.000Z",
	output: {
		status: "calculated",
		grossFourthIncome: "12500.00",
		calculatedTaxBeforeAdditionalDeductions: "320.00",
		registeredWithholdings: "250.00",
		differenceAfterRegisteredWithholdings: "70.00",
		includedIncomeCount: 3,
	},
};

describe("HomeService", () => {
	const taxProfileService = { getCurrentUser: jest.fn() };
	const documentsService = { countVisible: jest.fn() };
	const taxStatusService = { getCurrent: jest.fn() };

	const service = new HomeService(
		taxProfileService as unknown as TaxProfileService,
		documentsService as unknown as DocumentsService,
		taxStatusService as unknown as TaxStatusService,
	);

	beforeEach(() => {
		jest.clearAllMocks();
		documentsService.countVisible.mockResolvedValue(0);
	});

	it("throws PROFILE_INCOMPLETE when onboarding is required", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: true,
			profile: null,
		});

		await expect(service.getCurrentHome("user-1")).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
			response: { code: "PROFILE_INCOMPLETE" },
		});
		expect(taxStatusService.getCurrent).not.toHaveBeenCalled();
	});

	it("prioritizes a pending RHE for an independent profile", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: "profile-1", status: "complete", incomeMode: "independent" },
		});
		documentsService.countVisible.mockResolvedValue(2);
		taxStatusService.getCurrent.mockResolvedValue({
			status: "attention_required",
			taxYear: 2026,
			evaluation,
			openAttentionCount: 1,
		});

		const result = await service.getCurrentHome("user-1");

		expect(result.status).toBe("attention_required");
		expect(result.primary).toEqual({
			code: "REVIEW_FOURTH_INCOME",
			title: "Revisa un recibo por honorarios",
			description: "Confirma si corresponde a un ingreso tuyo.",
			action: "review_document",
		});
		expect(result.attention.count).toBe(1);
		expect(result.taxSummary).toEqual({
			evaluationId: "evaluation-1",
			calculatedAt: "2026-08-21T15:00:00.000Z",
			grossFourthIncome: "12500.00",
			calculatedTaxBeforeAdditionalDeductions: "320.00",
			registeredWithholdings: "250.00",
			differenceAfterRegisteredWithholdings: "70.00",
			includedIncomeCount: 3,
		});
	});

	it("presents a calculated evaluation with neutral copy", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: "profile-1", status: "complete", incomeMode: "independent" },
		});
		taxStatusService.getCurrent.mockResolvedValue({
			status: "calculated",
			taxYear: 2026,
			evaluation,
			openAttentionCount: 0,
		});

		const result = await service.getCurrentHome("user-1");

		expect(result.status).toBe("calculated");
		expect(result.primary).toEqual({
			code: "VIEW_TAX_STATUS",
			title: "Estimación actualizada",
			description: "Con tus datos registrados hasta hoy.",
			action: "open_tax_status",
		});
		expect(JSON.stringify(result)).not.toMatch(/al día|sin pendientes tributarios/i);
	});

	it("invites an independent user without evaluations to add the first income", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: "profile-1", status: "complete", incomeMode: "independent" },
		});
		taxStatusService.getCurrent.mockResolvedValue({
			status: "insufficient_data",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 0,
		});

		const result = await service.getCurrentHome("user-1");

		expect(result.status).toBe("insufficient_data");
		expect(result.primary).toEqual({
			code: "ADD_FIRST_INCOME",
			title: "Registra tu primer ingreso",
			description: "Usaremos lo que efectivamente cobraste durante 2026.",
			action: "open_tax_income",
		});
		expect(result.taxSummary).toBeNull();
	});

	it.each(["employment", "mixed"])(
		"keeps the document flow and omits partial tax data for %s",
		async (incomeMode) => {
			taxProfileService.getCurrentUser.mockResolvedValue({
				taxYear: 2026,
				requiresOnboarding: false,
				profile: { id: "profile-1", status: "complete", incomeMode },
			});

			const result = await service.getCurrentHome("user-1");

			expect(result.status).toBe("starting");
			expect(result.primary.action).toBe("open_capture");
			expect(result.taxSummary).toBeNull();
			expect(taxStatusService.getCurrent).not.toHaveBeenCalled();
		},
	);
});
