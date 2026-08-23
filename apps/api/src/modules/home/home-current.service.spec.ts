import { HttpStatus } from "@nestjs/common";
import type { AttentionService } from "../attention/attention.service";
import type { DocumentsService } from "../documents/documents.service";
import type { TaxPeriodService } from "../tax-period/tax-period.service";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { TaxStatusService } from "../tax-status/tax-status.service";
import { HomeCurrentService } from "./home-current.service";

const workEvaluation = {
	id: "evaluation-2",
	rulesetVersion: "pe-2026.2.0",
	calculatedAt: "2026-08-23T12:00:00.000Z",
	output: {
		status: "calculated",
		rulesetVersion: "pe-2026.2.0",
		taxYear: 2026,
		grossFourthIncome: "12000.00",
		grossFifthIncome: "48000.00",
		calculatedTaxBeforeAdditionalDeductions: "900.00",
		registeredWithholdings: "600.00",
		differenceAfterRegisteredWithholdings: "300.00",
		includedIncomeCount: 4,
		coverage: {
			incomeCoverage: "partial",
			deductionCoverage: "partial",
			monthlyCoverage: "partial",
			excludedFactors: ["annual_filing_obligation_not_determined"],
		},
		additionalDeductions: {
			includedAdditionalDeduction: "850.00",
			potentialAmountBeforeCap: "320.00",
			decisions: [
				{ disposition: "included", verificationStatus: "user_confirmed" },
				{ disposition: "included", verificationStatus: "evidence_attached" },
				{ disposition: "potential", verificationStatus: "unknown" },
			],
		},
	},
};

describe("HomeCurrentService", () => {
	const taxProfileService = { getCurrentUser: jest.fn() };
	const documentsService = { countVisible: jest.fn() };
	const taxStatusService = { getCurrent: jest.fn() };
	const attentionService = { getOpenForUser: jest.fn() };
	const taxPeriodService = { countOutstandingPeriods: jest.fn() };
	const service = new HomeCurrentService(
		taxProfileService as unknown as TaxProfileService,
		documentsService as unknown as DocumentsService,
		taxStatusService as unknown as TaxStatusService,
		attentionService as unknown as AttentionService,
		taxPeriodService as unknown as TaxPeriodService,
	);

	beforeEach(() => {
		jest.clearAllMocks();
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: "profile-1", taxYear: 2026, incomeMode: "mixed" },
		});
		documentsService.countVisible.mockResolvedValue(5);
		taxStatusService.getCurrent.mockResolvedValue({
			status: "calculated",
			taxYear: 2026,
			evaluation: workEvaluation,
			openAttentionCount: 0,
			monthlyPeriods: [],
		});
		attentionService.getOpenForUser.mockResolvedValue({
			count: 1,
			items: [],
			nextItem: {
				id: "attention-1",
				itemType: "review_monthly_fourth",
				title: "Revisa agosto",
				description: "Confirma los datos registrados para este mes.",
				action: { kind: "review_monthly_fourth", period: "2026-08" },
			},
		});
		taxPeriodService.countOutstandingPeriods.mockResolvedValue(1);
	});

	it.each(["independent", "employment", "mixed"])(
		"projects the complete current read model for %s without client arithmetic",
		async (incomeMode) => {
			taxProfileService.getCurrentUser.mockResolvedValue({
				taxYear: 2026,
				requiresOnboarding: false,
				profile: { id: "profile-1", taxYear: 2026, incomeMode },
			});

			const result = await service.getCurrentHome("user-1");

			expect(result).toMatchObject({
				status: "attention_required",
				attention: {
					count: 1,
					nextItem: { action: { kind: "review_monthly_fourth", period: "2026-08" } },
				},
				workIncome: { fourthGrossAmount: "12000.00", employmentGrossAmount: "48000.00" },
				deductions: {
					includedAmount: "850.00",
					potentialAmount: "320.00",
					unknownCount: 1,
					includedVerificationStatuses: ["user_confirmed", "evidence_attached"],
				},
				coverage: workEvaluation.output.coverage,
				monthlyOutstandingCount: 1,
				taxSummary: { differenceAfterRegisteredWithholdings: "300.00" },
				summary: { processedDocuments: 5 },
			});
			expect(result.primary.action).toEqual({
				kind: "review_monthly_fourth",
				period: "2026-08",
			});
			expect(taxPeriodService.countOutstandingPeriods).toHaveBeenCalledWith("user-1", 2026);
			expect(JSON.stringify(result)).not.toMatch(/up_to_date|al d.a|deuda|reembolso|definitiv/i);
		},
	);

	it("returns null summaries instead of fabricating values without an evaluation", async () => {
		taxStatusService.getCurrent.mockResolvedValue({
			status: "insufficient_data",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 0,
			monthlyPeriods: [],
		});
		attentionService.getOpenForUser.mockResolvedValue({
			count: 0,
			items: [],
			nextItem: null,
		});
		taxPeriodService.countOutstandingPeriods.mockResolvedValue(0);

		const result = await service.getCurrentHome("user-1");

		expect(result).toMatchObject({
			status: "insufficient_data",
			attention: { count: 0, nextItem: null },
			workIncome: null,
			deductions: null,
			coverage: null,
			monthlyOutstandingCount: 0,
			taxSummary: null,
			primary: { action: { kind: "open_tax_income", incomeMode: "mixed" } },
		});
	});

	it.each([
		["independent", { kind: "open_tax_income", incomeMode: "independent" }],
		["employment", { kind: "open_tax_income", incomeMode: "employment" }],
		["mixed", { kind: "open_tax_income", incomeMode: "mixed" }],
	] as const)("authors the first-income destination for %s", async (incomeMode, action) => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: "profile-1", taxYear: 2026, incomeMode },
		});
		taxStatusService.getCurrent.mockResolvedValue({
			status: "insufficient_data",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 0,
			monthlyPeriods: [],
		});
		attentionService.getOpenForUser.mockResolvedValue({ count: 0, items: [], nextItem: null });
		taxPeriodService.countOutstandingPeriods.mockResolvedValue(0);

		await expect(service.getCurrentHome("user-1")).resolves.toMatchObject({
			primary: { action },
		});
	});

	it("creates an actionable first monthly review from elapsed unreviewed periods", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: "profile-1", taxYear: 2026, incomeMode: "independent" },
		});
		taxStatusService.getCurrent.mockResolvedValue({
			status: "calculated",
			taxYear: 2026,
			evaluation: workEvaluation,
			openAttentionCount: 0,
			monthlyPeriods: [
				{ period: "2026-01", status: "user_recorded_complete" },
				{ period: "2026-02", status: "not_reviewed" },
			],
		});
		attentionService.getOpenForUser.mockResolvedValue({ count: 0, items: [], nextItem: null });
		taxPeriodService.countOutstandingPeriods.mockResolvedValue(0);

		const result = await service.getCurrentHome("user-1");

		expect(result).toMatchObject({
			status: "attention_required",
			attention: {
				count: 1,
				nextItem: {
					itemType: "review_monthly_fourth",
					action: { kind: "review_monthly_fourth", period: "2026-02" },
				},
			},
			monthlyOutstandingCount: 1,
		});
	});

	it("never calls an insufficient snapshot an updated estimate", async () => {
		taxStatusService.getCurrent.mockResolvedValue({
			status: "insufficient_data",
			taxYear: 2026,
			evaluation: {
				...workEvaluation,
				output: { ...workEvaluation.output, status: "insufficient_data" },
			},
			openAttentionCount: 0,
		});
		attentionService.getOpenForUser.mockResolvedValue({
			count: 0,
			items: [],
			nextItem: null,
		});
		taxPeriodService.countOutstandingPeriods.mockResolvedValue(0);

		const result = await service.getCurrentHome("user-1");

		expect(result.primary).toMatchObject({
			title: "Completa tus ingresos",
			action: { kind: "open_tax_income", incomeMode: "mixed" },
		});
		expect(JSON.stringify(result.primary)).not.toMatch(/estimaci.n actualizada/i);
	});

	it("keeps legacy pe-2026.1.0 evaluations readable", async () => {
		taxStatusService.getCurrent.mockResolvedValue({
			status: "calculated",
			taxYear: 2026,
			evaluation: {
				...workEvaluation,
				rulesetVersion: "pe-2026.1.0",
				output: {
					status: "calculated",
					grossFourthIncome: "12500.00",
					calculatedTaxBeforeAdditionalDeductions: "320.00",
					registeredWithholdings: "250.00",
					differenceAfterRegisteredWithholdings: "70.00",
					includedIncomeCount: 3,
				},
			},
			openAttentionCount: 0,
		});
		attentionService.getOpenForUser.mockResolvedValue({
			count: 0,
			items: [],
			nextItem: null,
		});
		taxPeriodService.countOutstandingPeriods.mockResolvedValue(0);

		const result = await service.getCurrentHome("user-1");

		expect(result.workIncome).toEqual({
			fourthGrossAmount: "12500.00",
			employmentGrossAmount: null,
		});
		expect(result.deductions).toBeNull();
		expect(result.coverage).toBeNull();
	});

	it("rejects incomplete profiles before starting read-model queries", async () => {
		taxProfileService.getCurrentUser.mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: true,
			profile: null,
		});

		await expect(service.getCurrentHome("user-1")).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
		});
		expect(attentionService.getOpenForUser).not.toHaveBeenCalled();
		expect(taxPeriodService.countOutstandingPeriods).not.toHaveBeenCalled();
	});

	it("propagates dependency failures instead of serving a partial read model", async () => {
		taxStatusService.getCurrent.mockRejectedValue(new Error("status unavailable"));

		await expect(service.getCurrentHome("user-1")).rejects.toThrow("status unavailable");
	});
});
