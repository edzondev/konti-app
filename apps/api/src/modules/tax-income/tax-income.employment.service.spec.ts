import type { DatabaseService } from "../../database/database.service";
import type { DatabaseExecutor } from "../../database/database.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { TaxStatusService } from "../tax-status/tax-status.service";
import { TaxIncomeService } from "./tax-income.service";
import type { TaxIncomeRecord, TaxIncomeRepositoryPort } from "./tax-income.types";

const executor = {} as DatabaseExecutor;
const profileId = "11111111-1111-4111-8111-111111111111";
const employmentInput = {
	incomeType: "employment" as const,
	recordKind: "period" as const,
	coverageStart: "2026-03-01",
	coverageEnd: "2026-03-31",
	coverageScope: "single_payer" as const,
	grossAmount: "5000.00",
	withheldTaxAmount: "150.00",
	payerName: "ACME SAC",
	payerTaxId: "20123456789",
	notes: null,
	idempotencyKey: "22222222-2222-4222-8222-222222222222",
};

function employmentRecord(overrides: Partial<TaxIncomeRecord> = {}): TaxIncomeRecord {
	return {
		id: "employment-1",
		taxProfileId: profileId,
		sourceDocumentId: null,
		incomeType: "employment",
		activityClassificationSource: null,
		source: "manual",
		idempotencyKey: employmentInput.idempotencyKey,
		receivedAt: null,
		recordKind: "period",
		coverageStart: "2026-03-01",
		coverageEnd: "2026-03-31",
		coverageScope: "single_payer",
		calculationDisposition: "included",
		coveredByRecordId: null,
		coverageResolutionReason: null,
		grossAmount: "5000.00",
		withheldTaxAmount: "150.00",
		currencyCode: "PEN",
		exchangeRate: null,
		grossAmountPen: "5000.00",
		withheldTaxAmountPen: "150.00",
		payerName: "ACME SAC",
		payerTaxId: "20123456789",
		status: "confirmed",
		notes: null,
		deletedAt: null,
		createdAt: new Date("2026-08-23T12:00:00.000Z"),
		updatedAt: new Date("2026-08-23T12:00:00.000Z"),
		...overrides,
	};
}

function harness() {
	const repository = {
		lockTaxProfileForEvaluation: jest.fn(async () => undefined),
		findByIdempotencyKey: jest.fn(async () => undefined),
		insertManual: jest.fn(async () => employmentRecord()),
		getOwnedForUpdate: jest.fn(),
		updateOwned: jest.fn(),
		softDeleteOwned: jest.fn(),
		getOwned: jest.fn(async () => employmentRecord()),
		listVisible: jest.fn(async () => []),
		sumVisible: jest.fn(async () => ({
			grossAmount: "0.00",
			withheldTaxAmount: "0.00",
			count: 0,
			fourthGrossAmount: "0.00",
			employmentGrossAmount: "0.00",
			withheldFourth: "0.00",
			withheldFifth: "0.00",
			fourthCount: 0,
			employmentCount: 0,
		})),
		getDocumentForUpdate: jest.fn(),
		findActiveBySourceDocument: jest.fn(),
		insertDocumentIncome: jest.fn(),
		resolveFourthIncomeAttention: jest.fn(),
		keepFourthIncomeAttentionOpen: jest.fn(),
		getDocumentCandidateSource: jest.fn(),
		recalculateEmploymentCoverage: jest.fn(async () => undefined),
		resolveEmploymentCoverageConflict: jest.fn(async () =>
			employmentRecord({
				calculationDisposition: "included",
				coverageResolutionReason: "user_confirmed_separate_income",
			}),
		),
	} as unknown as jest.Mocked<TaxIncomeRepositoryPort>;
	const database = {
		db: { transaction: jest.fn(async (work: (tx: DatabaseExecutor) => unknown) => work(executor)) },
	} as unknown as DatabaseService;
	const taxStatus = {
		evaluateAndPersist: jest.fn(async () => ({
			status: "calculated",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 0,
		})),
	} as unknown as jest.Mocked<TaxStatusService>;
	const profile = {
		getCurrentUser: jest.fn(async () => ({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: profileId, taxYear: 2026, incomeMode: "employment", status: "complete" },
		})),
	} as unknown as TaxProfileService;
	return {
		service: new TaxIncomeService(repository, database, taxStatus, profile),
		repository,
		taxStatus,
	};
}

describe("TaxIncomeService employment", () => {
	it("persists, resolves coverage and evaluates fifth category in one transaction", async () => {
		const { service, repository, taxStatus } = harness();

		await expect(service.createManual("user-1", employmentInput)).resolves.toMatchObject({
			record: {
				incomeType: "employment",
				recordKind: "period",
				coverageStart: "2026-03-01",
				payerTaxId: "20123456789",
			},
		});
		expect(repository.insertManual).toHaveBeenCalledWith(executor, {
			taxProfileId: profileId,
			...employmentInput,
		});
		expect(repository.recalculateEmploymentCoverage).toHaveBeenCalledWith(executor, profileId);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledWith(executor, {
			taxProfileId: profileId,
			taxYear: 2026,
			triggeredBy: "tax_income_created",
			incomeMode: "employment",
		});
		expect(
			(repository.recalculateEmploymentCoverage as jest.Mock).mock.invocationCallOrder[0],
		).toBeLessThan(
			taxStatus.evaluateAndPersist.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
	});

	it("persists a canonical zero withholding before reevaluating fifth category", async () => {
		const { service, repository, taxStatus } = harness();
		const input = {
			...employmentInput,
			grossAmount: "650.00",
			withheldTaxAmount: "0.00",
			payerTaxId: null,
			notes: null,
		};

		await service.createManual("user-1", input);

		expect(repository.insertManual).toHaveBeenCalledWith(executor, {
			taxProfileId: profileId,
			...input,
		});
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledTimes(1);
	});

	it("confirms payroll OCR only through an explicit user decision", async () => {
		const { service, repository, taxStatus } = harness();
		repository.getDocumentForUpdate.mockResolvedValueOnce({
			id: "33333333-3333-4333-8333-333333333333",
			taxProfileId: profileId,
			status: "ready",
			documentType: "payroll_slip",
			currencyCode: "PEN",
			issueDate: "2026-04-05",
			taxRelevanceStatus: "potentially_relevant",
			normalizedResult: {},
		});
		repository.insertDocumentIncome.mockResolvedValueOnce(
			employmentRecord({
				source: "document",
				sourceDocumentId: "33333333-3333-4333-8333-333333333333",
				idempotencyKey: null,
			}),
		);

		await service.decideDocument("user-1", {
			documentId: "33333333-3333-4333-8333-333333333333",
			decision: "employment_confirmed",
			incomeType: "employment",
			recordKind: "period",
			coverageStart: "2026-03-01",
			coverageEnd: "2026-03-31",
			coverageScope: "single_payer",
			grossAmount: "5000.00",
			withheldTaxAmount: "150.00",
			payerName: "ACME SAC",
			payerTaxId: "20123456789",
			notes: null,
		});

		expect(repository.insertDocumentIncome).toHaveBeenCalledWith(
			executor,
			expect.objectContaining({ incomeType: "employment", payerTaxId: "20123456789" }),
		);
		expect(repository.recalculateEmploymentCoverage).toHaveBeenCalledWith(executor, profileId);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledTimes(1);
	});

	it("resolves an owned employment conflict and reevaluates in the same transaction", async () => {
		const { service, repository, taxStatus } = harness();
		repository.getOwnedForUpdate.mockResolvedValueOnce(
			employmentRecord({ calculationDisposition: "needs_resolution" }),
		);
		repository.getOwned.mockResolvedValueOnce(
			employmentRecord({
				calculationDisposition: "included",
				coverageResolutionReason: "user_confirmed_separate_income",
			}),
		);
		const resolveConflict = (
			service as TaxIncomeService & {
				resolveEmploymentCoverageConflict: (
					userId: string,
					recordId: string,
					input: { decision: "include_separately" },
				) => Promise<unknown>;
			}
		).resolveEmploymentCoverageConflict;

		await expect(
			resolveConflict.call(service, "user-1", "employment-1", {
				decision: "include_separately",
			}),
		).resolves.toMatchObject({
			record: {
				id: "employment-1",
				calculationDisposition: "included",
				coverageResolutionReason: "user_confirmed_separate_income",
			},
		});
		expect(repository.lockTaxProfileForEvaluation).toHaveBeenCalledWith(executor, profileId);
		expect(repository.resolveEmploymentCoverageConflict).toHaveBeenCalledWith(
			executor,
			profileId,
			expect.objectContaining({
				id: "employment-1",
				calculationDisposition: "needs_resolution",
			}),
			"include_separately",
		);
		expect(repository.recalculateEmploymentCoverage).not.toHaveBeenCalled();
		expect(repository.getOwned).not.toHaveBeenCalled();
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledWith(
			executor,
			expect.objectContaining({ triggeredBy: "tax_income_updated" }),
		);
	});
});
