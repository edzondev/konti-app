import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { Database, DatabaseExecutor } from "../../database/database.types";
import { TaxIncomeRepository } from "./tax-income.repository";
import type { TaxIncomeRecord } from "./tax-income.types";

const taxProfileId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";

function buildInsertedIncomeRow(values: Record<string, unknown>) {
	return {
		id: "income-from-document",
		taxProfileId: values.taxProfileId,
		sourceDocumentId: values.sourceDocumentId,
		incomeType: values.incomeType,
		activityClassificationSource: values.activityClassificationSource,
		source: values.source,
		idempotencyKey: values.idempotencyKey,
		receivedAt: values.receivedAt,
		grossAmount: values.grossAmount,
		withheldTaxAmount: values.withheldTaxAmount,
		currencyCode: values.currencyCode,
		exchangeRate: values.exchangeRate,
		grossAmountPen: values.grossAmountPen,
		withheldTaxAmountPen: values.withheldTaxAmountPen,
		payerName: values.payerName,
		payerTaxId: values.payerTaxId,
		status: values.status,
		notes: values.notes,
		deletedAt: null,
		createdAt: new Date("2026-08-21T15:00:00.000Z"),
		updatedAt: new Date("2026-08-21T15:00:00.000Z"),
	};
}

function createInsertDocumentIncomeExecutor() {
	let insertedValues: Record<string, unknown> | undefined;
	const returning = jest.fn(async () =>
		insertedValues ? [buildInsertedIncomeRow(insertedValues)] : [],
	);
	const onConflictDoNothing = jest.fn(() => ({ returning }));
	const values = jest.fn((nextValues: Record<string, unknown>) => {
		insertedValues = nextValues;
		return { onConflictDoNothing };
	});
	const insert = jest.fn(() => ({ values }));

	return {
		executor: { insert } as unknown as DatabaseExecutor,
		values,
		getInsertedValues: () => insertedValues,
	};
}

function createFourthIncomeAttentionExecutor() {
	let insertedValues: Record<string, unknown> | undefined;
	let conflictConfig: Record<string, unknown> | undefined;
	const onConflictDoUpdate = jest.fn(async (nextConflictConfig: Record<string, unknown>) => {
		conflictConfig = nextConflictConfig;
	});
	const values = jest.fn((nextValues: Record<string, unknown>) => {
		insertedValues = nextValues;
		return { onConflictDoUpdate };
	});
	const insert = jest.fn(() => ({ values }));

	return {
		executor: { insert } as unknown as DatabaseExecutor,
		getInsertedValues: () => insertedValues,
		getConflictConfig: () => conflictConfig,
	};
}

function employmentRecord(id: string, overrides: Partial<TaxIncomeRecord> = {}): TaxIncomeRecord {
	return {
		id,
		taxProfileId,
		sourceDocumentId: null,
		incomeType: "employment",
		activityClassificationSource: null,
		source: "manual",
		idempotencyKey: `${id}-idempotency`,
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

function createCoverageRecalculationExecutor(rows: TaxIncomeRecord[]) {
	const selectForUpdate = jest.fn(async () => rows);
	const selectWhere = jest.fn(() => ({ for: selectForUpdate }));
	const selectFrom = jest.fn(() => ({ where: selectWhere }));
	const select = jest.fn(() => ({ from: selectFrom }));
	const updateWhere = jest.fn(async () => undefined);
	const updateSet = jest.fn(() => ({ where: updateWhere }));
	const update = jest.fn(() => ({ set: updateSet }));
	const onConflictDoUpdate = jest.fn(async () => undefined);
	const insertValues = jest.fn(() => ({ onConflictDoUpdate }));
	const insert = jest.fn(() => ({ values: insertValues }));
	const execute = jest.fn(async (_statement: unknown) => undefined);

	return {
		executor: { execute, insert, select, update } as unknown as DatabaseExecutor,
		execute,
		insert,
		insertValues,
		onConflictDoUpdate,
		select,
		update,
	};
}

function createManualCoverageResolutionExecutor(
	otherRows: TaxIncomeRecord[],
	updatedTarget: TaxIncomeRecord,
) {
	const selectForUpdate = jest.fn(async () => otherRows);
	const selectWhere = jest.fn(() => ({ for: selectForUpdate }));
	const selectFrom = jest.fn(() => ({ where: selectWhere }));
	const select = jest.fn(() => ({ from: selectFrom }));
	const returning = jest.fn(async () => [updatedTarget]);
	const updateWhere = jest.fn(() => ({ returning }));
	const updateSet = jest.fn(() => ({ where: updateWhere }));
	const update = jest.fn(() => ({ set: updateSet }));
	const onConflictDoUpdate = jest.fn(async () => undefined);
	const insertValues = jest.fn(() => ({ onConflictDoUpdate }));
	const insert = jest.fn(() => ({ values: insertValues }));
	const execute = jest.fn(async (_statement: unknown) => undefined);

	return {
		executor: { execute, insert, select, update } as unknown as DatabaseExecutor,
		execute,
		insert,
		select,
		update,
	};
}

describe("TaxIncomeRepository", () => {
	it("persists a paid fee receipt activity chosen by the user as manual_confirmation", async () => {
		const repository = new TaxIncomeRepository({} as Database);
		const harness = createInsertDocumentIncomeExecutor();

		const record = await repository.insertDocumentIncome(harness.executor, {
			taxProfileId,
			sourceDocumentId: documentId,
			activityType: "fourth_special",
			receivedAt: "2026-08-20",
			grossAmount: "2500.00",
			withheldTaxAmount: "0.00",
			payerName: "Cliente SAC",
			notes: null,
		});

		expect(harness.getInsertedValues()).toEqual(
			expect.objectContaining({
				taxProfileId,
				sourceDocumentId: documentId,
				incomeType: "fourth_special",
				activityClassificationSource: "manual_confirmation",
				source: "document",
			}),
		);
		expect(record).toMatchObject({
			id: "income-from-document",
			incomeType: "fourth_special",
			activityClassificationSource: "manual_confirmation",
			source: "document",
		});
	});

	it.each(["unpaid", "unsure"] as const)(
		"reopens %s attention with collection-confirmation copy and CTA on conflict",
		async (decision) => {
			const repository = new TaxIncomeRepository({} as Database);
			const harness = createFourthIncomeAttentionExecutor();

			await repository.keepFourthIncomeAttentionOpen(
				harness.executor,
				taxProfileId,
				documentId,
				decision,
			);

			expect(harness.getInsertedValues()).toEqual(
				expect.objectContaining({
					taxProfileId,
					documentId,
					source: "document_processing",
					itemType: "confirm_fourth_income",
					status: "open",
					priority: "normal",
					title: "Confirma si este RHE ya fue cobrado",
					message: "Registra la fecha real cuando recibas el pago.",
					actionType: "confirm_fourth_income",
					actionPayload: { documentId },
					resolution: { decision },
					resolvedAt: null,
				}),
			);
			expect(harness.getConflictConfig()).toEqual(
				expect.objectContaining({
					set: expect.objectContaining({
						status: "open",
						priority: "normal",
						title: "Confirma si este RHE ya fue cobrado",
						message: "Registra la fecha real cuando recibas el pago.",
						actionType: "confirm_fourth_income",
						actionPayload: { documentId },
						resolution: { decision },
						resolvedAt: null,
					}),
				}),
			);
			const conflictSet = harness.getConflictConfig()?.set as Record<string, unknown> | undefined;
			expect(conflictSet?.title).not.toBe("Confirma si este RHE es un ingreso tuyo");
			expect(conflictSet?.message).not.toBe(
				"Revisa la fecha de cobro y los importes antes de registrarlo.",
			);
		},
	);

	describe("employment coverage persistence", () => {
		it("uses no per-record operation when there are no employment rows", async () => {
			const repository = new TaxIncomeRepository({} as Database);
			const harness = createCoverageRecalculationExecutor([]);

			await repository.recalculateEmploymentCoverage(harness.executor, taxProfileId);

			expect(harness.update).toHaveBeenCalledTimes(1);
			expect(harness.execute).not.toHaveBeenCalled();
			expect(harness.insert).not.toHaveBeenCalled();
		});

		it("persists one resolution with one set-based income operation", async () => {
			const repository = new TaxIncomeRepository({} as Database);
			const harness = createCoverageRecalculationExecutor([employmentRecord("march")]);

			await repository.recalculateEmploymentCoverage(harness.executor, taxProfileId);

			expect(harness.update).toHaveBeenCalledTimes(1);
			expect(harness.execute).toHaveBeenCalledTimes(1);
			expect(harness.insert).not.toHaveBeenCalled();
			const statement = harness.execute.mock.calls[0]?.[0] as SQL;
			const query = new PgDialect().sqlToQuery(statement);
			expect(query.sql).toContain('UPDATE "tax_income_records"');
			expect(query.sql).toContain('"tax_income_records"."tax_profile_id" = $');
			expect(query.sql).toContain("updated_at = now()");
			expect(query.sql).not.toContain("march");
			expect(query.params).toEqual(["march", "included", null, null, taxProfileId]);
		});

		it("persists many resolutions and conflicts with two constant-size bulk operations", async () => {
			const repository = new TaxIncomeRepository({} as Database);
			const harness = createCoverageRecalculationExecutor([
				employmentRecord("jan-jun", {
					recordKind: "year_to_date_snapshot",
					coverageStart: "2026-01-01",
					coverageEnd: "2026-06-30",
					grossAmount: "30000.00",
					grossAmountPen: "30000.00",
					payerTaxId: null,
				}),
				employmentRecord("may-aug", {
					recordKind: "year_to_date_snapshot",
					coverageStart: "2026-05-01",
					coverageEnd: "2026-08-31",
					grossAmount: "32000.00",
					grossAmountPen: "32000.00",
					payerTaxId: null,
				}),
				employmentRecord("september", {
					coverageStart: "2026-09-01",
					coverageEnd: "2026-09-30",
					payerName: "BETA SAC",
					payerTaxId: "20987654321",
				}),
			]);

			await repository.recalculateEmploymentCoverage(harness.executor, taxProfileId);

			expect(harness.update).toHaveBeenCalledTimes(1);
			expect(harness.execute).toHaveBeenCalledTimes(1);
			expect(harness.insert).toHaveBeenCalledTimes(1);
			expect(harness.insertValues).toHaveBeenCalledWith([
				expect.objectContaining({
					taxProfileId,
					deduplicationKey: "employment-coverage:jan-jun",
				}),
				expect.objectContaining({
					taxProfileId,
					deduplicationKey: "employment-coverage:may-aug",
				}),
			]);
			expect(harness.onConflictDoUpdate).toHaveBeenCalledTimes(1);
		});

		it("reuses the locked target during manual resolution without updating or reading it again", async () => {
			const repository = new TaxIncomeRepository({} as Database);
			const current = employmentRecord("march", { calculationDisposition: "needs_resolution" });
			const provider = employmentRecord("jan-jun", {
				recordKind: "year_to_date_snapshot",
				coverageStart: "2026-01-01",
				coverageEnd: "2026-06-30",
				grossAmount: "30000.00",
				grossAmountPen: "30000.00",
			});
			const updated = employmentRecord("march", {
				calculationDisposition: "excluded_by_coverage",
				coveredByRecordId: "jan-jun",
				coverageResolutionReason: "user_confirmed_covered_by_record",
			});
			const harness = createManualCoverageResolutionExecutor([provider], updated);

			await expect(
				repository.resolveEmploymentCoverageConflict(
					harness.executor,
					taxProfileId,
					current,
					"exclude_as_covered",
				),
			).resolves.toMatchObject({
				id: "march",
				calculationDisposition: "excluded_by_coverage",
				coveredByRecordId: "jan-jun",
				coverageResolutionReason: "user_confirmed_covered_by_record",
			});

			expect(harness.select).toHaveBeenCalledTimes(1);
			expect(harness.update).toHaveBeenCalledTimes(2);
			expect(harness.execute).toHaveBeenCalledTimes(1);
			expect(harness.insert).not.toHaveBeenCalled();
			const statement = harness.execute.mock.calls[0]?.[0] as SQL;
			const query = new PgDialect().sqlToQuery(statement);
			expect(query.params).not.toContain("march");
			expect(query.params).toContain("jan-jun");
		});
	});
});
