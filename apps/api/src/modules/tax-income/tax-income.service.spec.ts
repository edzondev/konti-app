import { HttpStatus } from "@nestjs/common";
import type { DatabaseService } from "../../database/database.service";
import type { DatabaseExecutor } from "../../database/database.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { TaxStatusService } from "../tax-status/tax-status.service";
import { encodeTaxIncomeCursor } from "./tax-income.cursor";
import { TaxIncomeService } from "./tax-income.service";
import type { TaxIncomeRecord, TaxIncomeRepositoryPort } from "./tax-income.types";
import type { CreateTaxIncomeInput, UpdateTaxIncomeInput } from "./tax-income.validation";

const taxProfileId = "11111111-1111-4111-8111-111111111111";
const idempotencyKey = "22222222-2222-4222-8222-222222222222";
const validInput: CreateTaxIncomeInput = {
	receivedAt: "2026-08-21",
	grossAmount: "2500.00",
	withheldTaxAmount: "200.00",
	payerName: "Cliente SAC",
	notes: null,
	idempotencyKey,
};

type TransactionState = { records: Map<string, TaxIncomeRecord> };

function cloneRecords(records: Map<string, TaxIncomeRecord>) {
	return new Map([...records].map(([id, record]) => [id, structuredClone(record)] as const));
}

function createHarness() {
	let committedRecords = new Map<string, TaxIncomeRecord>();
	let sequence = 0;
	const database = {
		db: {
			transaction: jest.fn(async (work: (tx: DatabaseExecutor) => Promise<unknown>) => {
				const state: TransactionState = { records: cloneRecords(committedRecords) };
				const result = await work(state as unknown as DatabaseExecutor);
				committedRecords = state.records;
				return result;
			}),
		},
	} as unknown as DatabaseService;
	const stateFor = (executor: DatabaseExecutor | undefined) =>
		(executor as unknown as TransactionState | undefined)?.records ?? committedRecords;
	const repository: jest.Mocked<TaxIncomeRepositoryPort> = {
		lockTaxProfileForEvaluation: jest.fn(
			async (_executor: DatabaseExecutor, _profileId: string) => undefined,
		),
		findByIdempotencyKey: jest.fn(async (executor, profileId, key) =>
			[...stateFor(executor).values()].find(
				(record) => record.taxProfileId === profileId && record.idempotencyKey === key,
			),
		),
		insertManual: jest.fn(async (executor, values) => {
			sequence += 1;
			const now = new Date("2026-08-21T15:00:00.000Z");
			const record: TaxIncomeRecord = {
				id: `income-${sequence}`,
				taxProfileId: values.taxProfileId,
				sourceDocumentId: null,
				incomeType: "independent_services",
				source: "manual",
				idempotencyKey: values.idempotencyKey,
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
			stateFor(executor).set(record.id, record);
			return structuredClone(record);
		}),
		getOwnedForUpdate: jest.fn(async (executor, profileId, id) => {
			const record = stateFor(executor).get(id);
			return record?.taxProfileId === profileId && !record.deletedAt
				? structuredClone(record)
				: undefined;
		}),
		updateOwned: jest.fn(async (executor, profileId, id, values) => {
			const record = stateFor(executor).get(id);
			if (!record || record.taxProfileId !== profileId || record.deletedAt) return undefined;
			const updated: TaxIncomeRecord = {
				...record,
				receivedAt: values.receivedAt ?? record.receivedAt,
				grossAmount: values.grossAmount ?? record.grossAmount,
				withheldTaxAmount: values.withheldTaxAmount ?? record.withheldTaxAmount,
				payerName: values.payerName === undefined ? record.payerName : values.payerName,
				notes: values.notes === undefined ? record.notes : values.notes,
				grossAmountPen: values.grossAmount ?? record.grossAmountPen,
				withheldTaxAmountPen: values.withheldTaxAmount ?? record.withheldTaxAmountPen,
				updatedAt: new Date("2026-08-21T16:00:00.000Z"),
			};
			stateFor(executor).set(id, updated);
			return structuredClone(updated);
		}),
		softDeleteOwned: jest.fn(async (executor, profileId, id, deletedAt) => {
			const record = stateFor(executor).get(id);
			if (!record || record.taxProfileId !== profileId || record.deletedAt) return undefined;
			const deleted = { ...record, deletedAt, updatedAt: deletedAt };
			stateFor(executor).set(id, deleted);
			return structuredClone(deleted);
		}),
		getOwned: jest.fn(async (executor, profileId, id) => {
			const record = stateFor(executor).get(id);
			return record?.taxProfileId === profileId && !record.deletedAt
				? structuredClone(record)
				: undefined;
		}),
		listVisible: jest.fn(async (executor, profileId, query) =>
			[...stateFor(executor).values()]
				.filter((record) => record.taxProfileId === profileId && !record.deletedAt)
				.sort(
					(left, right) =>
						right.receivedAt.localeCompare(left.receivedAt) ||
						right.createdAt.getTime() - left.createdAt.getTime() ||
						right.id.localeCompare(left.id),
				)
				.filter(
					(record) =>
						!query.cursor ||
						record.receivedAt < query.cursor.receivedAt ||
						(record.receivedAt === query.cursor.receivedAt &&
							record.createdAt < new Date(query.cursor.createdAt)) ||
						(record.receivedAt === query.cursor.receivedAt &&
							record.createdAt.getTime() === new Date(query.cursor.createdAt).getTime() &&
							record.id < query.cursor.id),
				)
				.slice(0, query.limit + 1)
				.map((record) => structuredClone(record)),
		),
		sumVisible: jest.fn(async (executor, profileId, _taxYear: 2026) => {
			const visible = [...stateFor(executor).values()].filter(
				(record) => record.taxProfileId === profileId && !record.deletedAt,
			);
			return {
				grossAmount: visible
					.reduce((total, record) => total + Number(record.grossAmount), 0)
					.toFixed(2),
				withheldTaxAmount: visible
					.reduce((total, record) => total + Number(record.withheldTaxAmount), 0)
					.toFixed(2),
				count: visible.length,
			};
		}),
		getDocumentForUpdate: jest.fn(),
		findActiveBySourceDocument: jest.fn(),
		insertDocumentIncome: jest.fn(),
		resolveFourthIncomeAttention: jest.fn(),
		getDocumentCandidateSource: jest.fn(),
	};
	const taxStatus = {
		evaluateAndPersist: jest.fn(async () => ({
			status: "calculated" as const,
			taxYear: 2026 as const,
			evaluation: null,
			openAttentionCount: 0,
		})),
		getCurrent: jest.fn(async () => ({
			status: "calculated" as const,
			taxYear: 2026 as const,
			evaluation: null,
			openAttentionCount: 0,
		})),
	} as unknown as TaxStatusService;
	const taxProfile = {
		getCurrentUser: jest.fn(async () => ({
			taxYear: 2026,
			requiresOnboarding: false,
			profile: {
				id: taxProfileId,
				taxYear: 2026,
				incomeMode: "independent",
				status: "complete",
			},
		})),
	} as unknown as TaxProfileService;
	const service = new TaxIncomeService(repository, database, taxStatus, taxProfile);

	return {
		service,
		repository,
		database,
		taxStatus: taxStatus as unknown as jest.Mocked<TaxStatusService>,
		getCommittedRecords: () => cloneRecords(committedRecords),
	};
}

describe("TaxIncomeService", () => {
	it("creates a confirmed PEN income and evaluates it in the same transaction", async () => {
		const { service, repository, taxStatus } = createHarness();

		await expect(service.createManual("user-1", validInput)).resolves.toMatchObject({
			record: {
				id: "income-1",
				source: "manual",
				incomeType: "independent_services",
				grossAmount: "2500.00",
				withheldTaxAmount: "200.00",
				currencyCode: "PEN",
				status: "confirmed",
			},
			taxStatus: { status: "calculated" },
		});
		expect(repository.lockTaxProfileForEvaluation).toHaveBeenCalledWith(
			expect.anything(),
			taxProfileId,
		);
		expect(repository.lockTaxProfileForEvaluation.mock.invocationCallOrder[0]).toBeLessThan(
			repository.insertManual.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
		expect(repository.lockTaxProfileForEvaluation.mock.invocationCallOrder[0]).toBeLessThan(
			taxStatus.evaluateAndPersist.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
		);
	});

	it("returns the original record for the same idempotency key and payload", async () => {
		const { service, repository, taxStatus } = createHarness();
		const first = await service.createManual("user-1", validInput);
		const second = await service.createManual("user-1", validInput);

		expect(second.record.id).toBe(first.record.id);
		expect(repository.insertManual).toHaveBeenCalledTimes(1);
		expect(taxStatus.evaluateAndPersist).toHaveBeenCalledTimes(1);
	});

	it("rejects reuse of an idempotency key with a different payload", async () => {
		const { service } = createHarness();
		await service.createManual("user-1", validInput);

		await expect(
			service.createManual("user-1", { ...validInput, grossAmount: "2501.00" }),
		).rejects.toMatchObject({
			status: HttpStatus.CONFLICT,
			response: { code: "TAX_INCOME_IDEMPOTENCY_CONFLICT" },
		});
	});

	it("returns the winning record after a concurrent idempotency insert", async () => {
		const { service, repository, getCommittedRecords } = createHarness();
		const first = await service.createManual("user-1", validInput);
		const winner = getCommittedRecords().get(first.record.id);
		expect(winner).toBeDefined();
		repository.findByIdempotencyKey.mockResolvedValueOnce(undefined).mockResolvedValueOnce(winner);
		repository.insertManual.mockResolvedValueOnce(undefined);

		await expect(service.createManual("user-1", validInput)).resolves.toMatchObject({
			record: { id: first.record.id },
		});
	});

	it("updates an owned income and recalculates", async () => {
		const { service, repository } = createHarness();
		const created = await service.createManual("user-1", validInput);
		repository.lockTaxProfileForEvaluation.mockClear();

		await expect(
			service.update("user-1", created.record.id, {
				grossAmount: "3000.00",
			} as UpdateTaxIncomeInput),
		).resolves.toMatchObject({
			record: { grossAmount: "3000.00", grossAmountPen: "3000.00" },
			taxStatus: { status: "calculated" },
		});
		expect(repository.lockTaxProfileForEvaluation).toHaveBeenCalledTimes(1);
	});

	it("rejects a partial update that would leave withholding above gross", async () => {
		const { service } = createHarness();
		const created = await service.createManual("user-1", validInput);

		await expect(
			service.update("user-1", created.record.id, {
				grossAmount: "100.00",
			} as UpdateTaxIncomeInput),
		).rejects.toMatchObject({
			status: HttpStatus.BAD_REQUEST,
			response: { code: "TAX_INCOME_WITHHOLDING_EXCEEDS_GROSS" },
		});
	});

	it("soft-deletes an income and returns its minimal identity", async () => {
		const { service, repository, getCommittedRecords } = createHarness();
		const created = await service.createManual("user-1", validInput);
		repository.lockTaxProfileForEvaluation.mockClear();

		const result = await service.remove("user-1", created.record.id);

		expect(result).toMatchObject({
			record: { id: "income-1", deletedAt: expect.any(String) },
			taxStatus: { status: "calculated" },
		});
		expect(getCommittedRecords().get(created.record.id)?.deletedAt?.toISOString()).toEqual(
			expect.any(String),
		);
		expect(repository.lockTaxProfileForEvaluation).toHaveBeenCalledTimes(1);
	});

	it("rolls back the income when tax evaluation fails", async () => {
		const { service, taxStatus, getCommittedRecords } = createHarness();
		taxStatus.evaluateAndPersist.mockRejectedValueOnce(new Error("evaluation failed"));

		await expect(service.createManual("user-1", validInput)).rejects.toThrow("evaluation failed");
		expect(getCommittedRecords().size).toBe(0);
	});

	it("returns an owned visible income without internal tenancy fields", async () => {
		const { service } = createHarness();
		const created = await service.createManual("user-1", validInput);

		const record = await service.getOne("user-1", created.record.id);

		expect(record).toMatchObject({ id: created.record.id, grossAmount: "2500.00" });
		expect(JSON.stringify(record)).not.toContain("taxProfileId");
		expect(JSON.stringify(record)).not.toContain("idempotencyKey");
	});

	it("lists a page with annual totals and a cursor from the last returned row", async () => {
		const { service } = createHarness();
		await service.createManual("user-1", validInput);
		await service.createManual("user-1", {
			...validInput,
			grossAmount: "500.00",
			withheldTaxAmount: "0.00",
			idempotencyKey: "33333333-3333-4333-8333-333333333333",
		});

		const result = await service.list("user-1", { year: 2026, limit: 1 });

		expect(result.items).toHaveLength(1);
		expect(result.nextCursor).toEqual(expect.any(String));
		expect(result.summary).toEqual({
			grossAmount: "3000.00",
			withheldTaxAmount: "200.00",
			count: 2,
		});
	});

	it("rejects a cursor whose ordering fields do not match its owned row", async () => {
		const { service } = createHarness();
		const created = await service.createManual("user-1", validInput);
		const forgedCursor = encodeTaxIncomeCursor({
			receivedAt: "2026-01-01",
			createdAt: created.record.createdAt.toISOString(),
			id: created.record.id,
		});

		await expect(
			service.list("user-1", { year: 2026, limit: 20, cursor: forgedCursor }),
		).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
	});
});
