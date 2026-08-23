import type { DatabaseExecutor } from "../../database/database.types";
import type { TaxDeductionRecord } from "../tax-deductions/tax-deduction.types";
import { TaxEngineService } from "../tax-engine/tax-engine.service";
import type { FourthCategory2026Income } from "../tax-engine/tax-engine.types";
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
	let incomes: FourthCategory2026Income[] = [
		{
			id: "income-1",
			activityType: "fourth_ordinary",
			receivedAt: "2026-08-21",
			grossAmountPen: "100000.00",
			withheldTaxAmountPen: "5000.00",
		},
	];
	const evaluations: CompletedTaxEvaluation[] = [];
	let openAttentionCount = 0;
	let deductions: TaxDeductionRecord[] = [];
	let confirmedAdvancePayments = "0.00";
	let monthlyReviews: Array<{
		period: string;
		coverage: "complete" | "partial" | "unknown";
		activityClassification: "ordinary" | "special" | "unknown";
	}> = [];
	let monthlyPeriodStates: Array<{
		period: string;
		status:
			| "insufficient_data"
			| "no_action_detected"
			| "action_likely_required"
			| "awaiting_user_confirmation"
			| "user_recorded_complete";
	}> = [];
	const repository = {
		listConfirmedFourthIncome: jest.fn(
			async (_executor: DatabaseExecutor | undefined, _taxProfileId: string, _taxYear: 2026) =>
				structuredClone(incomes),
		),
		listConfirmedEmploymentIncome: jest.fn(
			async (_executor: DatabaseExecutor | undefined, _taxProfileId: string, _taxYear: 2026) => [],
		),
		listTaxDeductions: jest.fn(
			async (_executor: DatabaseExecutor | undefined, _taxProfileId: string, _taxYear: 2026) =>
				structuredClone(deductions),
		),
		getConfirmedAdvancePayments: jest.fn(
			async (_executor: DatabaseExecutor | undefined, _taxProfileId: string, _taxYear: 2026) =>
				confirmedAdvancePayments,
		),
		listMonthlyFourthReviews: jest.fn(async () => structuredClone(monthlyReviews)),
		listMonthlyPeriodStates: jest.fn(async () => structuredClone(monthlyPeriodStates)),
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
	} as unknown as jest.Mocked<TaxStatusRepositoryPort> & {
		listMonthlyFourthReviews: jest.Mock;
	};

	return {
		service: new TaxStatusService(repository, new TaxEngineService(), createProfileService()),
		repository,
		evaluations,
		setIncomes(next: FourthCategory2026Income[]) {
			incomes = next;
		},
		setOpenAttentionCount(count: number) {
			openAttentionCount = count;
		},
		setDeductions(next: TaxDeductionRecord[]) {
			deductions = next;
		},
		setConfirmedAdvancePayments(value: string) {
			confirmedAdvancePayments = value;
		},
		setMonthlyReviews(
			next: Array<{
				period: string;
				coverage: "complete" | "partial" | "unknown";
				activityClassification: "ordinary" | "special" | "unknown";
			}>,
		) {
			monthlyReviews = next;
		},
		setMonthlyPeriodStates(next: typeof monthlyPeriodStates) {
			monthlyPeriodStates = next;
		},
	};
}

describe("TaxStatusService", () => {
	it("marks monthly coverage complete when every elapsed Lima month is confirmed", async () => {
		jest.useFakeTimers().setSystemTime(new Date("2026-08-23T17:00:00.000Z"));
		try {
			const { service, repository, evaluations, setMonthlyReviews } = createHarness();
			setMonthlyReviews(
				Array.from({ length: 8 }, (_, index) => ({
					period: `2026-${String(index + 1).padStart(2, "0")}`,
					coverage: "complete" as const,
					activityClassification: "ordinary" as const,
				})),
			);

			await service.evaluateAndPersist(executor, {
				taxProfileId,
				taxYear: 2026,
				triggeredBy: "tax_period_reviewed",
			});

			expect(repository.listMonthlyFourthReviews).toHaveBeenCalledWith(
				executor,
				taxProfileId,
				2026,
				"2026-08",
			);
			expect(evaluations[0]?.outputSnapshot).toMatchObject({
				coverage: { monthlyCoverage: "complete" },
			});
		} finally {
			jest.useRealTimers();
		}
	});

	it("keeps monthly coverage unknown when no elapsed month has been reviewed", async () => {
		jest.useFakeTimers().setSystemTime(new Date("2026-08-23T17:00:00.000Z"));
		try {
			const { service, evaluations } = createHarness();

			await service.evaluateAndPersist(executor, {
				taxProfileId,
				taxYear: 2026,
				triggeredBy: "tax_period_reviewed",
			});

			expect(evaluations[0]?.outputSnapshot).toMatchObject({
				coverage: { monthlyCoverage: "unknown" },
			});
		} finally {
			jest.useRealTimers();
		}
	});

	it("marks monthly coverage partial when any elapsed month is missing", async () => {
		jest.useFakeTimers().setSystemTime(new Date("2026-08-23T17:00:00.000Z"));
		try {
			const { service, evaluations, setMonthlyReviews } = createHarness();
			setMonthlyReviews(
				Array.from({ length: 7 }, (_, index) => ({
					period: `2026-${String(index + 1).padStart(2, "0")}`,
					coverage: "complete" as const,
					activityClassification: "ordinary" as const,
				})),
			);

			await service.evaluateAndPersist(executor, {
				taxProfileId,
				taxYear: 2026,
				triggeredBy: "tax_period_reviewed",
			});

			expect(evaluations[0]?.outputSnapshot).toMatchObject({
				coverage: { monthlyCoverage: "partial" },
			});
		} finally {
			jest.useRealTimers();
		}
	});

	it("marks monthly coverage not applicable when there is no fourth-category income", async () => {
		const { service, evaluations, setIncomes } = createHarness();
		setIncomes([]);

		await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			triggeredBy: "tax_period_reviewed",
		});

		expect(evaluations[0]?.outputSnapshot).toMatchObject({
			coverage: { monthlyCoverage: "not_applicable" },
		});
	});

	it("returns stable insufficient data without creating an evaluation from GET", async () => {
		jest.useFakeTimers().setSystemTime(new Date("2026-03-15T17:00:00.000Z"));
		try {
			const { service, repository } = createHarness();

			await expect(service.getCurrent("user-1")).resolves.toEqual({
				status: "insufficient_data",
				taxYear: 2026,
				evaluation: null,
				openAttentionCount: 0,
				monthlyPeriods: [
					{ period: "2026-01", status: "not_reviewed" },
					{ period: "2026-02", status: "not_reviewed" },
					{ period: "2026-03", status: "not_reviewed" },
				],
			});
			expect(repository.insertCompletedEvaluation).not.toHaveBeenCalled();
			expect(repository.listConfirmedFourthIncome).not.toHaveBeenCalled();
		} finally {
			jest.useRealTimers();
		}
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

	it("persists every new independent evaluation with the unified work-income contract", async () => {
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
				calculationKind: "work_income",
				rulesetVersion: "pe-2026.2.0",
				output: {
					grossFourthIncome: "100000.00",
					grossOrdinaryFourthIncome: "100000.00",
					grossSpecialFourthIncome: "0.00",
					registeredWithholdings: "5000.00",
					differenceAfterRegisteredWithholdings: "-840.00",
					coverage: {
						monthlyCoverage: "unknown",
						excludedFactors: ["annual_filing_obligation_not_determined"],
					},
				},
			},
		});
		expect(evaluations[0]?.inputSnapshot).toMatchObject({
			taxYear: 2026,
			jurisdictionCode: "PE",
			currencyCode: "PEN",
			fourthIncomes: [{ id: "income-1", activityType: "fourth_ordinary" }],
			employmentIncomes: [],
		});
	});

	it("derives current monthly periods on read without mutating the stored snapshot", async () => {
		jest.useFakeTimers().setSystemTime(new Date("2026-03-15T17:00:00.000Z"));
		try {
			const { service, evaluations, setMonthlyPeriodStates, setMonthlyReviews } = createHarness();
			setMonthlyReviews([
				{
					period: "2026-01",
					coverage: "complete",
					activityClassification: "ordinary",
				},
			]);
			setMonthlyPeriodStates([{ period: "2026-01", status: "user_recorded_complete" }]);
			await service.evaluateAndPersist(executor, {
				taxProfileId,
				taxYear: 2026,
				incomeMode: "independent",
				triggeredBy: "tax_income_created",
			});
			const stored = structuredClone(evaluations[0]?.outputSnapshot);

			const current = await service.getCurrent("user-1");

			expect(current.monthlyPeriods).toEqual([
				{ period: "2026-01", status: "user_recorded_complete" },
				{ period: "2026-02", status: "not_reviewed" },
				{ period: "2026-03", status: "not_reviewed" },
			]);
			expect(current.evaluation?.output).toMatchObject({
				coverage: { monthlyCoverage: "partial" },
			});
			expect(evaluations[0]?.outputSnapshot).toEqual(stored);
		} finally {
			jest.useRealTimers();
		}
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
				activityType: "fourth_special",
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

	it("persists special fourth income without applying the automatic deduction", async () => {
		const { service, evaluations, setIncomes } = createHarness();
		setIncomes([
			{
				id: "special-income",
				activityType: "fourth_special",
				receivedAt: "2026-08-21",
				grossAmountPen: "10000.00",
				withheldTaxAmountPen: "800.00",
			},
		]);

		await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			triggeredBy: "tax_income_created",
		});

		expect(evaluations[0]?.outputSnapshot).toMatchObject({
			grossOrdinaryFourthIncome: "0.00",
			automaticDeduction20: "0.00",
			grossSpecialFourthIncome: "10000.00",
			netFourthIncome: "10000.00",
		});
	});

	it("persists a unified fifth-category snapshot without projecting missing months", async () => {
		const { service, repository, evaluations, setIncomes } = createHarness();
		setIncomes([]);
		repository.listConfirmedEmploymentIncome.mockResolvedValueOnce([
			{
				id: "employment-1",
				coverageStart: "2026-03-01",
				coverageEnd: "2026-03-31",
				grossAmountPen: "5000.00",
				withheldTaxAmountPen: "150.00",
				calculationDisposition: "included",
				payerTaxId: "20123456789",
				payerName: "ACME SAC",
			},
		]);

		const result = await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			incomeMode: "employment",
			triggeredBy: "tax_income_created",
		});

		expect(evaluations[0]?.inputSnapshot).toMatchObject({
			fourthIncomes: [],
			employmentIncomes: [{ coverageStart: "2026-03-01", coverageEnd: "2026-03-31" }],
		});
		expect(evaluations[0]?.outputSnapshot).toMatchObject({
			rulesetVersion: "pe-2026.2.0",
			grossFifthIncome: "5000.00",
			registeredFifthWithholdings: "150.00",
			includedFifthIncomeCount: 1,
		});
		expect(result.evaluation).toMatchObject({ calculationKind: "work_income" });
	});

	it("persists the included additional deduction and its audit decisions", async () => {
		const { service, evaluations, setDeductions } = createHarness();
		setDeductions([
			{
				id: "restaurant-1",
				category: "restaurants_hotels",
				paidAt: "2026-08-20",
				grossAmountPen: "1000.00",
				verificationStatus: "user_confirmed",
				calculationStatus: "included",
				requirements: [
					{ code: "accepted_document", status: "met" },
					{ code: "consumer_identity_correct", status: "met" },
					{ code: "payment_recorded", status: "met" },
					{ code: "compatible_economic_activity", status: "met" },
					{ code: "issuer_active_and_habido", status: "met" },
					{ code: "issued_in_tax_year", status: "met" },
					{ code: "banking_evidence_when_required", status: "met" },
				],
			},
		]);

		await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			incomeMode: "independent",
			triggeredBy: "tax_deduction_created",
		});

		expect(evaluations[0]?.inputSnapshot).toMatchObject({
			deductionRecords: [{ id: "restaurant-1" }],
		});
		expect(evaluations[0]?.outputSnapshot).toMatchObject({
			includedAdditionalDeduction: "150.00",
			additionalDeductions: {
				restaurantsHotelsDeduction: "150.00",
				decisions: [{ recordId: "restaurant-1", disposition: "included" }],
			},
		});
	});

	it("subtracts confirmed monthly fourth payments from the annual estimate", async () => {
		const { service, evaluations, setConfirmedAdvancePayments } = createHarness();
		setConfirmedAdvancePayments("400.00");

		await service.evaluateAndPersist(executor, {
			taxProfileId,
			taxYear: 2026,
			incomeMode: "independent",
			triggeredBy: "tax_payment_recorded",
		});

		expect(evaluations[0]?.inputSnapshot).toMatchObject({
			confirmedAdvancePayments: "400.00",
		});
		expect(evaluations[0]?.outputSnapshot).toMatchObject({
			confirmedAdvancePayments: "400.00",
			registeredCredits: "5400.00",
			differenceAfterRegisteredCredits: "-1240.00",
		});
	});
});
