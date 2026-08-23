import type { Database, DatabaseExecutor } from "../../database/database.types";
import { TaxPeriodRepository } from "./tax-period.repository";

const profileId = "11111111-1111-4111-8111-111111111111";
const idempotencyKey = "22222222-2222-4222-8222-222222222222";

describe("TaxPeriodRepository", () => {
	it("uses an earlier authorization whose effective window covers the requested month", async () => {
		const rowsBySelect = [
			[],
			[
				{
					id: "future-no",
					taxProfileId: profileId,
					period: "2026-03",
					answer: "no",
					authorizationDate: null,
					effectiveFrom: null,
					validThrough: null,
					restartState: "not_required",
					restartDate: null,
					verificationScope: "user_provided",
					source: "manual",
					sourceDocumentId: null,
					idempotencyKey: "33333333-3333-4333-8333-333333333333",
					deletedAt: null,
					createdAt: new Date("2026-03-01T12:00:00.000Z"),
					updatedAt: new Date("2026-03-01T12:00:00.000Z"),
				},
				{
					id: "january-authorization",
					taxProfileId: profileId,
					period: "2026-01",
					answer: "yes",
					authorizationDate: "2026-01-10",
					effectiveFrom: "2026-01-11",
					validThrough: "2026-12-31",
					restartState: "required",
					restartDate: "2026-02-15",
					verificationScope: "user_provided",
					source: "manual",
					sourceDocumentId: null,
					idempotencyKey: "44444444-4444-4444-8444-444444444444",
					deletedAt: null,
					createdAt: new Date("2026-01-10T12:00:00.000Z"),
					updatedAt: new Date("2026-01-10T12:00:00.000Z"),
				},
			],
			[],
			[],
			[],
			[],
			[{ value: 0 }],
		] as const;
		let selectIndex = 0;
		const select = jest.fn(() => {
			const rows = rowsBySelect[selectIndex++] ?? [];
			const query = Promise.resolve(rows) as Promise<typeof rows> & {
				where: jest.Mock;
				orderBy: jest.Mock;
				limit: jest.Mock;
			};
			query.where = jest.fn(() => query);
			query.orderBy = jest.fn(() => query);
			query.limit = jest.fn(async () => rows);
			return { from: jest.fn(() => query) };
		});
		const repository = new TaxPeriodRepository({ select } as unknown as Database);

		const result = await repository.loadPeriodData(undefined, profileId, "2026-02");

		expect(result.suspension?.id).toBe("january-authorization");
		expect(result.suspension?.restartDate).toBe("2026-02-15");
	});

	it("soft-deletes the previous payment before inserting the new independent fact", async () => {
		const calls: string[] = [];
		let inserted: Record<string, unknown> | undefined;
		const updateWhere = jest.fn(async () => {
			calls.push("soft-delete");
		});
		const set = jest.fn(() => ({ where: updateWhere }));
		const returning = jest.fn(async () => [
			{
				id: "payment-1",
				taxProfileId: profileId,
				period: "2026-01",
				answer: "yes",
				amountPen: "400.00",
				paidAt: "2026-02-10",
				confirmationCode: null,
				verificationScope: "user_provided",
				source: "manual",
				sourceDocumentId: null,
				idempotencyKey,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);
		const values = jest.fn((next: Record<string, unknown>) => {
			calls.push("insert");
			inserted = next;
			return { returning };
		});
		const executor = {
			update: jest.fn(() => ({ set })),
			insert: jest.fn(() => ({ values })),
		} as unknown as DatabaseExecutor;
		const repository = new TaxPeriodRepository({} as Database);

		await repository.replacePayment(executor, {
			taxProfileId: profileId,
			source: "manual",
			input: {
				period: "2026-01",
				idempotencyKey,
				answer: "yes",
				amountPen: "400.00",
				paidAt: "2026-02-10",
				confirmationCode: null,
				verificationScope: "user_provided",
				sourceDocumentId: null,
			},
		});

		expect(calls).toEqual(["soft-delete", "insert"]);
		expect(inserted).toEqual(
			expect.objectContaining({
				taxProfileId: profileId,
				period: "2026-01",
				amountPen: "400.00",
				paidAt: "2026-02-10",
				idempotencyKey,
			}),
		);
	});

	it("stores a reproducible period-review snapshot with exact month bounds", async () => {
		let inserted: Record<string, unknown> | undefined;
		const returning = jest.fn(async () => [{ id: "evaluation-1" }]);
		const values = jest.fn((next: Record<string, unknown>) => {
			inserted = next;
			return { returning };
		});
		const executor = { insert: jest.fn(() => ({ values })) } as unknown as DatabaseExecutor;
		const repository = new TaxPeriodRepository({} as Database);

		await repository.insertPeriodEvaluation(executor, {
			taxProfileId: profileId,
			period: "2026-02",
			rulesetVersion: "pe-2026.2.0",
			triggeredBy: "tax_payment_recorded",
			inputSnapshot: {} as never,
			outputSnapshot: {} as never,
			supersedesId: null,
		});

		expect(inserted).toEqual(
			expect.objectContaining({
				evaluationType: "period_review",
				periodStart: "2026-02-01",
				periodEnd: "2026-02-28",
				rulesetVersion: "pe-2026.2.0",
			}),
		);
	});
});
