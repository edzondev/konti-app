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
const paidDecision: Extract<DocumentDecisionInput, { decision: "paid" }> = {
	documentId,
	decision: "paid",
	activityType: "fourth_ordinary",
	receivedAt: "2026-08-20",
	grossAmount: "2500.00",
	withheldTaxAmount: "200.00",
	payerName: "Cliente SAC",
	notes: null,
};

type DecisionState = {
	activeIncome: TaxIncomeRecord | undefined;
	attentionStatus: "open" | "resolved";
	resolution: Record<string, unknown> | null;
};

function cloneState(state: DecisionState): DecisionState {
	return structuredClone(state);
}

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
			paymentTerms: "credit",
			dueDate: "2026-09-10",
			actualPaymentDate: null,
			grossFeeAmount: "2500.00",
			incomeTaxWithheldAmount: "200.00",
			netPaidAmount: "2300.00",
			payerName: "Cliente SAC",
		},
	};
	let committed: DecisionState = {
		activeIncome: undefined,
		attentionStatus: "open",
		resolution: null,
	};
	const stateFor = (executor: DatabaseExecutor) => executor as unknown as DecisionState;
	const repository = {
		lockTaxProfileForEvaluation: jest.fn(async () => undefined),
		getDocumentForUpdate: jest.fn(async () => structuredClone(document)),
		findActiveBySourceDocument: jest.fn(async (executor: DatabaseExecutor) => {
			const active = stateFor(executor).activeIncome;
			return active ? structuredClone(active) : undefined;
		}),
		insertDocumentIncome: jest.fn(async (executor: DatabaseExecutor, values) => {
			const state = stateFor(executor);
			if (state.activeIncome) return undefined;
			const now = new Date("2026-08-21T15:00:00.000Z");
			state.activeIncome = {
				id: "income-from-document",
				taxProfileId: profileId,
				sourceDocumentId: documentId,
				incomeType: values.activityType,
				activityClassificationSource: "manual_confirmation",
				source: "document",
				idempotencyKey: null,
				receivedAt: values.receivedAt,
				grossAmount: values.grossAmount,
				withheldTaxAmount: values.withheldTaxAmount,
				currencyCode: "PEN",
				exchangeRate: null,
				grossAmountPen: values.grossAmount,
				withheldTaxAmountPen: values.withheldTaxAmount,
				payerName: values.payerName,
				payerTaxId: null,
				status: "confirmed",
				notes: values.notes,
				deletedAt: null,
				createdAt: now,
				updatedAt: now,
			};
			return structuredClone(state.activeIncome);
		}),
		resolveFourthIncomeAttention: jest.fn(
			async (
				executor: DatabaseExecutor,
				_profileId: string,
				_documentId: string,
				resolution: Record<string, unknown>,
			) => {
				const state = stateFor(executor);
				state.attentionStatus = "resolved";
				state.resolution = structuredClone(resolution);
			},
		),
		keepFourthIncomeAttentionOpen: jest.fn(
			async (
				executor: DatabaseExecutor,
				_profileId: string,
				_documentId: string,
				decision: "unpaid" | "unsure" | "activity_unsure",
			) => {
				const state = stateFor(executor);
				state.attentionStatus = "open";
				state.resolution = { decision };
			},
		),
		getDocumentCandidateSource: jest.fn(async () => ({
			...structuredClone(document),
			hasActiveIncome: Boolean(committed.activeIncome),
			decision:
				committed.resolution?.decision === "paid" ||
				committed.resolution?.decision === "unpaid" ||
				committed.resolution?.decision === "unsure" ||
				committed.resolution?.decision === "not_mine"
					? committed.resolution.decision
					: null,
		})),
	} as unknown as jest.Mocked<TaxIncomeRepositoryPort>;
	const database = {
		db: {
			transaction: jest.fn(async (work: (tx: DatabaseExecutor) => Promise<unknown>) => {
				const transactional = cloneState(committed);
				const result = await work(transactional as unknown as DatabaseExecutor);
				committed = transactional;
				return result;
			}),
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
			status: committed.attentionStatus === "open" ? "attention_required" : "calculated",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: committed.attentionStatus === "open" ? 1 : 0,
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
		getCommittedState: () => cloneState(committed),
	};
}

describe("TaxIncomeService document decision", () => {
	it("creates one paid document income, resolves attention and recalculates", async () => {
		const { service, repository, taxStatus } = createHarness();

		await expect(service.decideDocument("user-1", paidDecision)).resolves.toMatchObject({
			record: {
				id: "income-from-document",
				sourceDocumentId: documentId,
				source: "document",
				incomeType: "fourth_ordinary",
				activityClassificationSource: "manual_confirmation",
				receivedAt: "2026-08-20",
			},
			taxStatus: { status: "calculated" },
		});
		expect(repository.resolveFourthIncomeAttention).toHaveBeenCalledWith(
			expect.anything(),
			profileId,
			documentId,
			{ decision: "paid", incomeRecordId: "income-from-document" },
		);
		expect(repository.lockTaxProfileForEvaluation.mock.invocationCallOrder[0]).toBeLessThan(
			repository.insertDocumentIncome.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
		expect(repository.lockTaxProfileForEvaluation.mock.invocationCallOrder[0]).toBeLessThan(
			taxStatus.evaluateAndPersist.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
	});

	it("returns the existing paid income when the same decision is repeated", async () => {
		const { service, repository, taxStatus } = createHarness();
		const first = await service.decideDocument("user-1", paidDecision);
		const second = await service.decideDocument("user-1", paidDecision);

		expect(second.record?.id).toBe(first.record?.id);
		expect(repository.insertDocumentIncome).toHaveBeenCalledTimes(1);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledTimes(1);
	});

	it.each(["unpaid", "unsure"] as const)(
		"keeps %s as actionable attention without creating income",
		async (decision) => {
			const { service, repository, taxStatus, getCommittedState } = createHarness();

			await expect(
				service.decideDocument("user-1", { documentId, decision }),
			).resolves.toMatchObject({
				record: null,
				taxStatus: { status: "attention_required" },
			});
			expect(repository.insertDocumentIncome).not.toHaveBeenCalled();
			expect(repository.keepFourthIncomeAttentionOpen).toHaveBeenCalledWith(
				expect.anything(),
				profileId,
				documentId,
				decision,
			);
			expect(taxStatus.evaluateAndPersist).not.toHaveBeenCalled();
			expect(getCommittedState()).toMatchObject({
				activeIncome: undefined,
				attentionStatus: "open",
				resolution: { decision },
			});
		},
	);

	it("keeps an unknown activity classification actionable without creating income", async () => {
		const { service, repository, taxStatus, getCommittedState } = createHarness();

		await expect(
			service.decideDocument("user-1", { documentId, decision: "activity_unsure" }),
		).resolves.toMatchObject({
			record: null,
			taxStatus: { status: "attention_required" },
		});
		expect(repository.insertDocumentIncome).not.toHaveBeenCalled();
		expect(repository.keepFourthIncomeAttentionOpen).toHaveBeenCalledWith(
			expect.anything(),
			profileId,
			documentId,
			"activity_unsure",
		);
		expect(taxStatus.evaluateAndPersist).not.toHaveBeenCalled();
		expect(getCommittedState()).toMatchObject({
			activeIncome: undefined,
			attentionStatus: "open",
			resolution: { decision: "activity_unsure" },
		});
	});

	it("resolves not-mine without changing document tax relevance", async () => {
		const { service, repository, taxStatus, document, getCommittedState } = createHarness();

		await expect(
			service.decideDocument("user-1", { documentId, decision: "not_mine" }),
		).resolves.toMatchObject({ record: null, taxStatus: { status: "calculated" } });
		expect(repository.insertDocumentIncome).not.toHaveBeenCalled();
		expect(taxStatus.evaluateAndPersist).not.toHaveBeenCalled();
		expect(getCommittedState().resolution).toEqual({ decision: "not_mine" });
		expect(document.taxRelevanceStatus).toBe("potentially_relevant");
	});

	it("rolls back paid income and attention when evaluation fails", async () => {
		const { service, taxStatus, getCommittedState } = createHarness();
		taxStatus.evaluateAndPersist.mockRejectedValueOnce(new Error("evaluation failed"));

		await expect(service.decideDocument("user-1", paidDecision)).rejects.toThrow(
			"evaluation failed",
		);
		expect(getCommittedState()).toEqual({
			activeIncome: undefined,
			attentionStatus: "open",
			resolution: null,
		});
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

		await expect(service.decideDocument("user-1", paidDecision)).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
			response: { code: "SOURCE_DOCUMENT_NOT_FEE_RECEIPT" },
		});
	});
});
