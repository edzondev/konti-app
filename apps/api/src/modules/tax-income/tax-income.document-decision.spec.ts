import { HttpStatus } from "@nestjs/common";
import type { DatabaseService } from "../../database/database.service";
import type { DatabaseExecutor } from "../../database/database.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { TaxStatusService } from "../tax-status/tax-status.service";
import { TaxIncomeService } from "./tax-income.service";
import type { TaxIncomeRecord, TaxIncomeRepositoryPort } from "./tax-income.types";
import type { DocumentDecisionInput } from "./tax-income.validation";

const profileId = "11111111-1111-4111-8111-111111111111";
const documentId = "33333333-3333-4333-8333-333333333333";
const confirmedDecision: DocumentDecisionInput = {
	documentId,
	decision: "confirmed",
	receivedAt: "2026-08-20",
	grossAmount: "2500.00",
	withheldTaxAmount: "200.00",
	payerName: "Cliente SAC",
	notes: null,
};

function createHarness() {
	const document = {
		id: documentId,
		taxProfileId: profileId,
		status: "ready",
		documentType: "fee_receipt",
		currencyCode: "PEN",
		issueDate: "2026-08-12",
		taxRelevanceStatus: "potentially_relevant",
		normalizedResult: {
			paymentDate: "2026-08-20",
			grossFeeAmount: "2500.00",
			incomeTaxWithheldAmount: "200.00",
			netPaidAmount: "2300.00",
			payerName: "Cliente SAC",
		},
	};
	let activeIncome: TaxIncomeRecord | undefined;
	let resolution: Record<string, unknown> | null = null;
	const repository = {
		lockTaxProfileForEvaluation: jest.fn(async () => undefined),
		getDocumentForUpdate: jest.fn(async () => structuredClone(document)),
		findActiveBySourceDocument: jest.fn(async () =>
			activeIncome ? structuredClone(activeIncome) : undefined,
		),
		insertDocumentIncome: jest.fn(
			async (_executor: DatabaseExecutor, values: Record<string, string | null>) => {
				if (activeIncome) return undefined;
				const now = new Date("2026-08-21T15:00:00.000Z");
				activeIncome = {
					id: "income-from-document",
					taxProfileId: profileId,
					sourceDocumentId: documentId,
					incomeType: "independent_services",
					source: "document",
					idempotencyKey: null,
					receivedAt: values.receivedAt as string,
					grossAmount: values.grossAmount as string,
					withheldTaxAmount: values.withheldTaxAmount as string,
					currencyCode: "PEN",
					exchangeRate: null,
					grossAmountPen: values.grossAmount as string,
					withheldTaxAmountPen: values.withheldTaxAmount as string,
					payerName: values.payerName ?? null,
					payerTaxId: null,
					status: "confirmed",
					notes: values.notes ?? null,
					deletedAt: null,
					createdAt: now,
					updatedAt: now,
				};
				return structuredClone(activeIncome);
			},
		),
		resolveFourthIncomeAttention: jest.fn(
			async (
				_executor: DatabaseExecutor,
				_profileId: string,
				_documentId: string,
				value: Record<string, unknown>,
			) => {
				resolution = structuredClone(value);
			},
		),
		getDocumentCandidateSource: jest.fn(async () => ({
			...structuredClone(document),
			hasActiveIncome: Boolean(activeIncome),
			decision: (resolution?.decision as "confirmed" | "not_mine" | undefined) ?? null,
		})),
	} as unknown as jest.Mocked<TaxIncomeRepositoryPort>;
	const database = {
		db: {
			transaction: jest.fn(async (work: (tx: DatabaseExecutor) => Promise<unknown>) =>
				work({} as DatabaseExecutor),
			),
		},
	} as unknown as DatabaseService;
	const taxStatus = {
		evaluateAndPersist: jest.fn(async () => ({
			status: "calculated",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 0,
		})),
		getCurrent: jest.fn(async () => ({
			status: "calculated",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 0,
		})),
	} as unknown as jest.Mocked<TaxStatusService>;
	const taxProfile = {
		getCurrentUser: jest.fn(async () => ({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: {
				id: profileId,
				taxYear: 2026,
				incomeMode: "independent",
				status: "complete",
			},
		})),
	} as unknown as TaxProfileService;

	return {
		service: new TaxIncomeService(repository, database, taxStatus, taxProfile),
		repository,
		taxStatus,
		document,
		getResolution: () => resolution,
	};
}

describe("TaxIncomeService document decision", () => {
	it("creates one document-backed income, resolves attention and recalculates", async () => {
		const { service, repository, taxStatus } = createHarness();

		await expect(service.decideDocument("user-1", confirmedDecision)).resolves.toMatchObject({
			record: {
				id: "income-from-document",
				sourceDocumentId: documentId,
				source: "document",
				receivedAt: "2026-08-20",
			},
			taxStatus: { status: "calculated" },
		});
		expect(repository.resolveFourthIncomeAttention).toHaveBeenCalledWith(
			expect.anything(),
			profileId,
			documentId,
			{ decision: "confirmed", incomeRecordId: "income-from-document" },
		);
		expect(repository.lockTaxProfileForEvaluation).toHaveBeenCalledWith(
			expect.anything(),
			profileId,
		);
		expect(repository.lockTaxProfileForEvaluation.mock.invocationCallOrder[0]).toBeLessThan(
			repository.insertDocumentIncome.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
		expect(repository.lockTaxProfileForEvaluation.mock.invocationCallOrder[0]).toBeLessThan(
			taxStatus.evaluateAndPersist.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
	});

	it("returns the existing income when confirmation is repeated", async () => {
		const { service, repository, taxStatus } = createHarness();
		const first = await service.decideDocument("user-1", confirmedDecision);
		const second = await service.decideDocument("user-1", confirmedDecision);

		expect(second.record?.id).toBe(first.record?.id);
		expect(repository.insertDocumentIncome).toHaveBeenCalledTimes(1);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledTimes(1);
	});

	it("resolves not-mine without changing document tax relevance", async () => {
		const { service, repository, taxStatus, document, getResolution } = createHarness();

		await expect(
			service.decideDocument("user-1", { documentId, decision: "not_mine" }),
		).resolves.toMatchObject({ record: null, taxStatus: { status: "calculated" } });
		expect(repository.insertDocumentIncome).not.toHaveBeenCalled();
		expect(taxStatus.evaluateAndPersist).not.toHaveBeenCalled();
		expect(getResolution()).toEqual({ decision: "not_mine" });
		expect(document.taxRelevanceStatus).toBe("potentially_relevant");
		expect(repository.lockTaxProfileForEvaluation).toHaveBeenCalledTimes(1);
	});

	it("rejects a ready document that is not a fee receipt", async () => {
		const { service, repository } = createHarness();
		repository.getDocumentForUpdate.mockResolvedValueOnce({
			id: documentId,
			taxProfileId: profileId,
			status: "ready",
			documentType: "invoice",
			currencyCode: "PEN",
		} as never);

		await expect(service.decideDocument("user-1", confirmedDecision)).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
			response: { code: "SOURCE_DOCUMENT_NOT_FEE_RECEIPT" },
		});
	});
});
