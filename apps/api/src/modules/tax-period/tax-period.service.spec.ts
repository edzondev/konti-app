import { HttpStatus } from "@nestjs/common";
import type { DatabaseService } from "../../database/database.service";
import type { DatabaseExecutor } from "../../database/database.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { TaxStatusService } from "../tax-status/tax-status.service";
import { TaxPeriodService } from "./tax-period.service";

const profileId = "11111111-1111-4111-8111-111111111111";
const firstKey = "22222222-2222-4222-8222-222222222222";
const secondKey = "33333333-3333-4333-8333-333333333333";
const atomicReview = {
	idempotencyKey: firstKey,
	coverage: "complete" as const,
	activityClassification: "ordinary" as const,
	suspension: {
		answer: "no" as const,
		authorizationDate: null,
		restartState: "not_required" as const,
		restartDate: null,
		verificationScope: "user_provided" as const,
		sourceDocumentId: null,
	},
	filing: {
		answer: "yes" as const,
		filedAt: "2026-02-10",
		confirmationNumber: null,
		verificationScope: "user_provided" as const,
		sourceDocumentId: null,
	},
	payment: {
		answer: "yes" as const,
		amountPen: "400.00",
		paidAt: "2026-02-10",
		confirmationCode: null,
		verificationScope: "user_provided" as const,
		sourceDocumentId: null,
	},
};

type Fact = Record<string, unknown>;
type State = {
	review: Fact;
	suspension: Fact;
	filing: Fact | null;
	payment: Fact | null;
	idempotent: Map<string, Fact>;
	evaluationCount: number;
	attentionOpen: boolean;
};

function initialState(): State {
	return {
		review: {
			id: "review-1",
			taxProfileId: profileId,
			period: "2026-01",
			coverage: "complete",
			activityClassification: "ordinary",
			idempotencyKey: "initial-review",
		},
		suspension: {
			id: "suspension-1",
			taxProfileId: profileId,
			period: "2026-01",
			answer: "no",
			authorizationDate: null,
			effectiveFrom: null,
			validThrough: null,
			restartState: "not_required",
			restartDate: null,
			verificationScope: "user_provided",
			source: "manual",
			sourceDocumentId: null,
			idempotencyKey: "initial-suspension",
		},
		filing: null,
		payment: null,
		idempotent: new Map(),
		evaluationCount: 0,
		attentionOpen: false,
	};
}

function createHarness() {
	let committed = initialState();
	const stateFor = (executor: DatabaseExecutor | undefined) =>
		(executor as unknown as State | undefined) ?? committed;
	const database = {
		db: {
			transaction: jest.fn(async (work: (executor: DatabaseExecutor) => Promise<unknown>) => {
				const pending = structuredClone(committed);
				const result = await work(pending as unknown as DatabaseExecutor);
				committed = pending;
				return result;
			}),
		},
	} as unknown as DatabaseService;
	const findIdempotent = (executor: DatabaseExecutor, kind: string, key: string) =>
		stateFor(executor).idempotent.get(`${kind}:${key}`);
	const replace = (executor: DatabaseExecutor, kind: string, values: Fact) => {
		const record = {
			id: `${kind}-${stateFor(executor).idempotent.size + 1}`,
			...values,
			createdAt: new Date("2026-08-23T12:00:00.000Z"),
			updatedAt: new Date("2026-08-23T12:00:00.000Z"),
			deletedAt: null,
		};
		stateFor(executor).idempotent.set(`${kind}:${String(values.idempotencyKey)}`, record);
		stateFor(executor)[kind as "review" | "suspension" | "filing" | "payment"] = record;
		return record;
	};
	const repository = {
		lockTaxProfile: jest.fn(async () => undefined),
		getOwnedDocumentForUpdate: jest.fn(async () => ({ id: "evidence-1" })),
		findPeriodReviewByIdempotencyKey: jest.fn((executor, _profile, key) =>
			findIdempotent(executor, "review", key),
		),
		findSuspensionByIdempotencyKey: jest.fn((executor, _profile, key) =>
			findIdempotent(executor, "suspension", key),
		),
		findFilingByIdempotencyKey: jest.fn((executor, _profile, key) =>
			findIdempotent(executor, "filing", key),
		),
		findPaymentByIdempotencyKey: jest.fn((executor, _profile, key) =>
			findIdempotent(executor, "payment", key),
		),
		replacePeriodReview: jest.fn(async (executor, values) => replace(executor, "review", values)),
		replaceSuspension: jest.fn(async (executor, values) =>
			replace(executor, "suspension", {
				taxProfileId: values.taxProfileId,
				...values.input,
				effectiveFrom: values.effectiveFrom,
				validThrough: values.validThrough,
				source: values.source,
			}),
		),
		replaceFiling: jest.fn(async (executor, values) =>
			replace(executor, "filing", {
				taxProfileId: values.taxProfileId,
				...values.input,
				source: values.source,
			}),
		),
		replacePayment: jest.fn(async (executor, values) =>
			replace(executor, "payment", {
				taxProfileId: values.taxProfileId,
				...values.input,
				source: values.source,
			}),
		),
		loadPeriodData: jest.fn(async (executor: DatabaseExecutor | undefined) => {
			const state = stateFor(executor);
			return {
				review: state.review,
				suspension: state.suspension,
				filing: state.filing,
				payment: state.payment,
				fourthIncomes: [
					{
						id: "income-1",
						activityType: "fourth_ordinary",
						receivedAt: "2026-01-15",
						grossAmountPen: "5000.00",
						withheldTaxAmountPen: "0.00",
					},
				],
				fifthGrossAmountPen: "0.00",
				pendingDocumentCount: 0,
			};
		}),
		findLatestPeriodEvaluation: jest.fn(async () => undefined),
		insertPeriodEvaluation: jest.fn(async (executor: DatabaseExecutor) => {
			stateFor(executor).evaluationCount += 1;
			return { id: `evaluation-${stateFor(executor).evaluationCount}` };
		}),
		syncMonthlyAttention: jest.fn(async (executor: DatabaseExecutor, values: Fact) => {
			stateFor(executor).attentionOpen = Boolean(values.open);
		}),
		countOutstandingPeriods: jest.fn(async () => (committed.attentionOpen ? 1 : 0)),
	};
	const taxProfile = {
		getCurrentUser: jest.fn(async () => ({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: { id: profileId, taxYear: 2026, incomeMode: "independent" as const },
		})),
	} as unknown as TaxProfileService;
	const taxStatus = {
		evaluateAndPersist: jest.fn(async () => ({ status: "attention_required" })),
		getCurrent: jest.fn(async () => ({ status: "attention_required" })),
	} as unknown as jest.Mocked<TaxStatusService>;
	const service = new TaxPeriodService(repository as never, database, taxProfile, taxStatus);

	return {
		service,
		repository,
		taxStatus,
		getCommitted: () => structuredClone(committed),
	};
}

describe("TaxPeriodService", () => {
	it("persists the complete review with one lock and one annual evaluation", async () => {
		const { service, repository, taxStatus } = createHarness();

		await expect(service.reviewPeriod("user-1", "2026-01", atomicReview)).resolves.toMatchObject({
			period: { period: "2026-01", filing: { state: "yes" }, payment: { state: "yes" } },
			taxStatus: { status: "attention_required" },
		});
		expect(repository.lockTaxProfile).toHaveBeenCalledTimes(1);
		expect(repository.replacePeriodReview).toHaveBeenCalledTimes(1);
		expect(repository.replaceSuspension).toHaveBeenCalledTimes(1);
		expect(repository.replaceFiling).toHaveBeenCalledTimes(1);
		expect(repository.replacePayment).toHaveBeenCalledTimes(1);
		expect(repository.loadPeriodData).toHaveBeenCalledTimes(1);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledTimes(1);
	});

	it("replays an atomic review without duplicating facts or evaluations", async () => {
		const { service, repository, taxStatus } = createHarness();

		const first = await service.reviewPeriod("user-1", "2026-01", atomicReview);
		const replay = await service.reviewPeriod("user-1", "2026-01", atomicReview);

		expect(replay).toEqual(first);
		expect(repository.replacePeriodReview).toHaveBeenCalledTimes(1);
		expect(repository.replaceFiling).toHaveBeenCalledTimes(1);
		expect(repository.replacePayment).toHaveBeenCalledTimes(1);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledTimes(1);
	});

	it("rejects reuse of the atomic root key with different answers", async () => {
		const { service } = createHarness();
		await service.reviewPeriod("user-1", "2026-01", atomicReview);

		await expect(
			service.reviewPeriod("user-1", "2026-01", {
				...atomicReview,
				payment: {
					...atomicReview.payment,
					answer: "no",
					amountPen: null,
					paidAt: null,
					confirmationCode: null,
				},
			}),
		).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
			response: { code: "TAX_PERIOD_IDEMPOTENCY_CONFLICT" },
		});
	});

	it("rolls back every atomic review fact when a later write fails", async () => {
		const { service, repository, getCommitted } = createHarness();
		repository.replacePayment.mockRejectedValueOnce(new Error("payment write failed"));

		await expect(service.reviewPeriod("user-1", "2026-01", atomicReview)).rejects.toThrow(
			"payment write failed",
		);
		expect(getCommitted()).toMatchObject({
			filing: null,
			payment: null,
			evaluationCount: 0,
		});
	});
	it("persists the monthly snapshot, attention and annual status in one transaction", async () => {
		const { service, repository, taxStatus } = createHarness();

		await expect(
			service.updatePeriod("user-1", "2026-01", {
				coverage: "complete",
				activityClassification: "ordinary",
				idempotencyKey: firstKey,
			}),
		).resolves.toMatchObject({
			period: "2026-01",
			status: "awaiting_user_confirmation",
			officialCompliance: "not_determined",
		});
		expect(repository.lockTaxProfile).toHaveBeenCalledWith(expect.anything(), profileId);
		expect(repository.insertPeriodEvaluation).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ rulesetVersion: "pe-2026.2.0", period: "2026-01" }),
		);
		expect(repository.syncMonthlyAttention).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ period: "2026-01", open: true }),
		);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ triggeredBy: "tax_period_reviewed" }),
		);
	});

	it("marks a required month complete only after filing and payment are both yes", async () => {
		const { service } = createHarness();

		const afterFiling = await service.recordFiling("user-1", {
			period: "2026-01",
			idempotencyKey: firstKey,
			answer: "yes",
			filedAt: "2026-02-10",
			confirmationNumber: null,
			verificationScope: "user_provided",
			sourceDocumentId: null,
		});
		const afterPayment = await service.recordPayment("user-1", {
			period: "2026-01",
			idempotencyKey: secondKey,
			answer: "yes",
			amountPen: "400.00",
			paidAt: "2026-02-10",
			confirmationCode: null,
			verificationScope: "user_provided",
			sourceDocumentId: null,
		});

		expect(afterFiling.status).toBe("awaiting_user_confirmation");
		expect(afterPayment.status).toBe("user_recorded_complete");
		expect(afterPayment.filing?.state).toBe("yes");
		expect(afterPayment.payment?.state).toBe("yes");
	});

	it("keeps an explicit no as an actionable monthly attention", async () => {
		const { service } = createHarness();

		const result = await service.recordPayment("user-1", {
			period: "2026-01",
			idempotencyKey: firstKey,
			answer: "no",
			amountPen: null,
			paidAt: null,
			confirmationCode: null,
			verificationScope: "user_provided",
			sourceDocumentId: null,
		});

		expect(result.status).toBe("action_likely_required");
	});

	it("returns an idempotent write once and rejects reuse with another payload", async () => {
		const { service, repository } = createHarness();
		const input = {
			period: "2026-01" as const,
			idempotencyKey: firstKey,
			answer: "no" as const,
			amountPen: null,
			paidAt: null,
			confirmationCode: null,
			verificationScope: "user_provided" as const,
			sourceDocumentId: null,
		};

		await service.recordPayment("user-1", input);
		await service.recordPayment("user-1", input);
		expect(repository.replacePayment).toHaveBeenCalledTimes(1);

		await expect(
			service.recordPayment("user-1", { ...input, answer: "unknown" }),
		).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
			response: { code: "TAX_PERIOD_IDEMPOTENCY_CONFLICT" },
		});
	});

	it("verifies evidence ownership before persisting an attached fact", async () => {
		const { service, repository } = createHarness();

		await service.recordFiling("user-1", {
			period: "2026-01",
			idempotencyKey: firstKey,
			answer: "yes",
			filedAt: "2026-02-10",
			confirmationNumber: null,
			verificationScope: "evidence_attached",
			sourceDocumentId: "44444444-4444-4444-8444-444444444444",
		});

		expect(repository.getOwnedDocumentForUpdate).toHaveBeenCalledWith(
			expect.anything(),
			profileId,
			"44444444-4444-4444-8444-444444444444",
		);
	});

	it("rolls back the monthly fact when annual status persistence fails", async () => {
		const { service, taxStatus, getCommitted } = createHarness();
		taxStatus.evaluateAndPersist.mockRejectedValueOnce(new Error("snapshot failed"));

		await expect(
			service.recordPayment("user-1", {
				period: "2026-01",
				idempotencyKey: firstKey,
				answer: "yes",
				amountPen: "400.00",
				paidAt: "2026-02-10",
				confirmationCode: null,
				verificationScope: "user_provided",
				sourceDocumentId: null,
			}),
		).rejects.toThrow("snapshot failed");
		expect(getCommitted().payment).toBeNull();
		expect(getCommitted().evaluationCount).toBe(0);
	});
});
