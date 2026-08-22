import type { DatabaseExecutor } from "../../database/database.types";
import { TaxEngineService } from "../tax-engine/tax-engine.service";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import { TaxStatusService } from "./tax-status.service";
import type { CompletedTaxEvaluation, TaxStatusRepositoryPort } from "./tax-status.types";

const taxProfileId = "11111111-1111-4111-8111-111111111111";
const executor = {} as DatabaseExecutor;

function createProfileService() {
	return {
		getCurrentUser: jest.fn().mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: {
				id: taxProfileId,
				taxYear: 2026,
				incomeMode: "independent",
				trackDeductibles: false,
				status: "complete",
				jurisdictionCode: "PE",
				currencyCode: "PEN",
				timezone: "America/Lima",
				completedAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		}),
	} as unknown as TaxProfileService;
}

function createHarness() {
	let incomes = [
		{
			id: "income-1",
			receivedAt: "2026-08-21",
			grossAmountPen: "100000.00",
			withheldTaxAmountPen: "5000.00",
		},
	];
	const evaluations: CompletedTaxEvaluation[] = [];
	let openAttentionCount = 0;
	const repository: jest.Mocked<TaxStatusRepositoryPort> = {
		listConfirmedFourthIncome: jest.fn(
			async (_executor: DatabaseExecutor | undefined, _taxProfileId: string, _taxYear: 2026) =>
				structuredClone(incomes),
		),
		findLatestCompleted: jest.fn(
			async (_executor: DatabaseExecutor | undefined, _taxProfileId: string, _taxYear: 2026) =>
				evaluations.at(-1),
		),
		insertCompletedEvaluation: jest.fn(async (_executor, values) => {
			const evaluation: CompletedTaxEvaluation = {
				id: `evaluation-${evaluations.length + 1}`,
				taxProfileId: values.taxProfileId,
				evaluationType: "current_status",
				status: "completed",
				rulesetVersion: values.rulesetVersion,
				periodStart: values.periodStart,
				periodEnd: values.periodEnd,
				triggeredBy: values.triggeredBy,
				inputSnapshot: structuredClone(values.inputSnapshot),
				outputSnapshot: structuredClone(values.outputSnapshot),
				supersedesId: values.supersedesId,
				completedAt: new Date("2026-08-21T15:00:00.000Z"),
				createdAt: new Date("2026-08-21T15:00:00.000Z"),
			};
			evaluations.push(evaluation);
			return structuredClone(evaluation);
		}),
		countOpenFourthIncomeAttention: jest.fn(
			async (_executor: DatabaseExecutor | undefined, _taxProfileId: string) => openAttentionCount,
		),
		getEvaluationOwned: jest.fn(async (_executor, profileId, evaluationId) =>
			evaluations.find(
				(evaluation) => evaluation.taxProfileId === profileId && evaluation.id === evaluationId,
			),
		),
	};

	return {
		service: new TaxStatusService(repository, new TaxEngineService(), createProfileService()),
		repository,
		evaluations,
		setIncomes(next: typeof incomes) {
			incomes = next;
		},
		setOpenAttentionCount(count: number) {
			openAttentionCount = count;
		},
	};
}

describe("TaxStatusService", () => {
	it("returns stable insufficient data without creating an evaluation from GET", async () => {
		const { service, repository } = createHarness();

		await expect(service.getCurrent("user-1")).resolves.toEqual({
			status: "insufficient_data",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 0,
		});
		expect(repository.insertCompletedEvaluation).not.toHaveBeenCalled();
		expect(repository.listConfirmedFourthIncome).not.toHaveBeenCalled();
	});

	it("elevates the public status when fourth-income attention is open", async () => {
		const { service, setOpenAttentionCount } = createHarness();
		setOpenAttentionCount(2);

		await expect(service.getCurrent("user-1")).resolves.toMatchObject({
			status: "attention_required",
			taxYear: 2026,
			evaluation: null,
			openAttentionCount: 2,
		});
	});

	it("persists a completed immutable snapshot using only confirmed mapped income", async () => {
		const { service, evaluations } = createHarness();

		const result = await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			triggeredBy: "tax_income_created",
		});

		expect(result).toMatchObject({
			status: "calculated",
			taxYear: 2026,
			openAttentionCount: 0,
			evaluation: {
				id: "evaluation-1",
				rulesetVersion: "pe-2026.1.0",
				output: {
					grossFourthIncome: "100000.00",
					registeredWithholdings: "5000.00",
					differenceAfterRegisteredWithholdings: "-840.00",
				},
			},
		});
		expect(evaluations[0]?.inputSnapshot).toMatchObject({
			taxYear: 2026,
			jurisdictionCode: "PE",
			currencyCode: "PEN",
			activity: "ordinary_independent_services",
			incomes: [{ id: "income-1" }],
		});
	});

	it("supersedes the previous evaluation without mutating its snapshots", async () => {
		const { service, evaluations, setIncomes } = createHarness();
		await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			triggeredBy: "tax_income_created",
		});
		const firstOutput = structuredClone(evaluations[0]?.outputSnapshot);
		setIncomes([
			{
				id: "income-2",
				receivedAt: "2026-08-22",
				grossAmountPen: "20000.00",
				withheldTaxAmountPen: "0.00",
			},
		]);

		await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			triggeredBy: "tax_income_updated",
		});

		expect(evaluations).toHaveLength(2);
		expect(evaluations[1]?.supersedesId).toBe("evaluation-1");
		expect(evaluations[0]?.outputSnapshot).toEqual(firstOutput);
		expect(evaluations[1]?.outputSnapshot).toMatchObject({ grossFourthIncome: "20000.00" });
	});
});
