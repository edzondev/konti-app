import { type InfiniteData, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { taxIncomeKeys } from "./tax-income.keys";
import {
	beginTaxIncomeCacheMutation,
	pendingTaxIncomeRecord,
	retryTaxIncomeOperation,
	rollbackTaxIncomeCacheMutation,
} from "./tax-income.optimistic";
import type { CreateTaxIncomeInput, TaxIncomePage } from "./types";

const createInput: CreateTaxIncomeInput = {
	activityType: "fourth_ordinary",
	receivedAt: "2026-08-20",
	grossAmount: "2500.00",
	withheldTaxAmount: "200.00",
	payerName: "Cliente SAC",
	notes: null,
	idempotencyKey: "request-1",
};

function seededClient() {
	const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
	queryClient.setQueryData<InfiniteData<TaxIncomePage>>(taxIncomeKeys.list("user-1", 2026), {
		pageParams: [undefined],
		pages: [
			{
				items: [],
				nextCursor: null,
				summary: { grossAmount: "0.00", withheldTaxAmount: "0.00", count: 0 },
			},
		],
	});
	return queryClient;
}

describe("tax income mutation lifecycle", () => {
	it("keeps an optimistic employment row out of the fourth-only cache", () => {
		const queryClient = new QueryClient();
		for (const filter of ["all", "employment", "fourth"] as const) {
			queryClient.setQueryData<InfiniteData<TaxIncomePage>>(
				taxIncomeKeys.list("user-1", 2026, filter),
				{
					pageParams: [undefined],
					pages: [
						{
							items: [],
							nextCursor: null,
							summary: { grossAmount: "0.00", withheldTaxAmount: "0.00", count: 0 },
						},
					],
				},
			);
		}
		const record = pendingTaxIncomeRecord(
			{
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
				idempotencyKey: "employment-1",
			},
			1_777_000_000_000,
		);

		beginTaxIncomeCacheMutation(queryClient, "user-1", { kind: "create", record });

		expect(
			queryClient.getQueryData<InfiniteData<TaxIncomePage>>(
				taxIncomeKeys.list("user-1", 2026, "all"),
			)?.pages[0]?.items,
		).toHaveLength(1);
		expect(
			queryClient.getQueryData<InfiniteData<TaxIncomePage>>(
				taxIncomeKeys.list("user-1", 2026, "employment"),
			)?.pages[0]?.items,
		).toHaveLength(1);
		expect(
			queryClient.getQueryData<InfiniteData<TaxIncomePage>>(
				taxIncomeKeys.list("user-1", 2026, "fourth"),
			)?.pages[0]?.items,
		).toHaveLength(0);
	});

	it("patches synchronously and restores the exact infinite cache after failure", () => {
		const queryClient = seededClient();
		const before = queryClient.getQueryData(taxIncomeKeys.list("user-1", 2026));

		const context = beginTaxIncomeCacheMutation(queryClient, "user-1", {
			kind: "create",
			record: {
				id: "pending:request-1",
				sourceDocumentId: null,
				incomeType: "fourth_ordinary",
				activityClassificationSource: "manual_confirmation",
				source: "manual",
				receivedAt: "2026-08-20",
				recordKind: "payment",
				coverageStart: null,
				coverageEnd: null,
				coverageScope: null,
				grossAmount: "2500.00",
				withheldTaxAmount: "200.00",
				currencyCode: "PEN",
				grossAmountPen: "2500.00",
				withheldTaxAmountPen: "200.00",
				payerName: "Cliente SAC",
				payerTaxId: null,
				calculationDisposition: "included",
				coveredByRecordId: null,
				coverageResolutionReason: null,
				status: "pending_sync",
				notes: null,
				deletedAt: null,
				createdAt: "2026-08-20T12:00:00.000Z",
				updatedAt: "2026-08-20T12:00:00.000Z",
			},
		});

		expect(
			queryClient.getQueryData<InfiniteData<TaxIncomePage>>(taxIncomeKeys.list("user-1", 2026))
				?.pages[0]?.items[0]?.status,
		).toBe("pending_sync");

		rollbackTaxIncomeCacheMutation(queryClient, context);
		expect(queryClient.getQueryData(taxIncomeKeys.list("user-1", 2026))).toEqual(before);
	});

	it("retries the same idempotent variables after an error and becomes successful", async () => {
		const queryClient = seededClient();
		const attempts: CreateTaxIncomeInput[] = [];
		const mutation = queryClient.getMutationCache().build(queryClient, {
			mutationKey: ["tax-income-records", "write", "create"],
			mutationFn: async (input: CreateTaxIncomeInput) => {
				attempts.push(input);
				if (attempts.length === 1) throw new Error("offline");
				return "saved";
			},
		});

		await expect(mutation.execute(createInput)).rejects.toThrow("offline");
		await expect(retryTaxIncomeOperation(queryClient, mutation.mutationId)).resolves.toBe(true);

		expect(attempts).toEqual([createInput, createInput]);
		expect(mutation.state.status).toBe("success");
	});

	it("does not retry a missing or variable-less operation", async () => {
		const queryClient = seededClient();
		const mutationFn = vi.fn(async () => undefined);
		queryClient.getMutationCache().build(queryClient, { mutationFn });

		await expect(retryTaxIncomeOperation(queryClient, 999_999)).resolves.toBe(false);
		expect(mutationFn).not.toHaveBeenCalled();
	});
});
