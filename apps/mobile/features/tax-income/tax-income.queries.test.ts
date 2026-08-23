import { describe, expect, it, vi } from "vitest";

import { taxStatusKeys } from "../tax-status/tax-status.queries";
import { getTaxIncomes } from "./tax-income.api";
import { committedMutationEffects, invalidateTaxIncomeRelated } from "./tax-income.mutations";
import { taxIncomeKeys, taxIncomeListQueryOptions } from "./tax-income.queries";

vi.mock("@/core/haptics", () => ({
	triggerHaptic: vi.fn(async () => undefined),
}));

vi.mock("./tax-income.api", () => ({
	createTaxIncome: vi.fn(),
	decideDocumentIncome: vi.fn(),
	deleteTaxIncome: vi.fn(),
	getTaxIncome: vi.fn(),
	getTaxIncomes: vi.fn(),
	updateTaxIncome: vi.fn(),
	resolveEmploymentCoverage: vi.fn(),
}));

vi.mock("../tax-status/tax-status.api", () => ({
	getCurrentTaxStatus: vi.fn(),
	getTaxEvaluation: vi.fn(),
}));

vi.mock("@/features/home/home.queries", () => ({
	homeKeys: { all: ["home"] as const },
}));

vi.mock("@/features/documents/documents.queries", () => ({
	documentKeys: {
		list: (userId: string) => ["documents", "list", userId] as const,
		detail: (userId: string, documentId: string) =>
			["documents", "detail", userId, documentId] as const,
	},
}));

describe("tax income query keys", () => {
	it("keeps each user and server filter in an isolated cache", () => {
		expect(taxIncomeKeys.all("user-1")).toEqual(["tax-income-records", "user-1"]);
		expect(taxIncomeKeys.lists("user-1")).toEqual(["tax-income-records", "user-1", "list"]);
		expect(taxIncomeKeys.list("user-1", 2026, "all")).toEqual([
			"tax-income-records",
			"user-1",
			"list",
			2026,
			"all",
		]);
		expect(taxIncomeKeys.list("user-1", 2026, "employment")).not.toEqual(
			taxIncomeKeys.list("user-1", 2026, "fourth"),
		);
		expect(taxIncomeKeys.list("user-1", 2026, "all")).not.toEqual(
			taxIncomeKeys.list("user-2", 2026, "all"),
		);
		expect(taxIncomeKeys.detail("user-1", "income-1")).toEqual([
			"tax-income-records",
			"user-1",
			"detail",
			"income-1",
		]);
		expect(taxStatusKeys.current("user-1")).toEqual(["tax-status", "user-1", "current"]);
	});

	it("passes the selected filter and cursor to the API", async () => {
		vi.mocked(getTaxIncomes).mockResolvedValue({
			items: [],
			nextCursor: null,
			summary: {},
		} as never);
		const options = taxIncomeListQueryOptions("user-1", 2026, "employment");

		await (options.queryFn as (context: { pageParam?: string }) => Promise<unknown>)({
			pageParam: "cursor-1",
		});

		expect(getTaxIncomes).toHaveBeenCalledWith("cursor-1", 2026, "employment");
	});
});

describe("invalidateTaxIncomeRelated", () => {
	it("invalidates tax, Home, and the source document after a document decision", async () => {
		const invalidateQueries = vi.fn(async () => undefined);

		await invalidateTaxIncomeRelated({ invalidateQueries } as never, {
			userId: "user-1",
			documentId: "document-1",
		});

		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: taxIncomeKeys.lists("user-1") });
		expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: taxIncomeKeys.all("user-1") });
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: taxStatusKeys.current("user-1"),
		});
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["home"] });
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ["documents", "list", "user-1"],
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ["documents", "detail", "user-1", "document-1"],
		});
	});

	it("does not report a committed write as failed when a cache refresh rejects", async () => {
		const invalidateQueries = vi.fn(async () => {
			throw new Error("refetch failed");
		});

		await expect(
			invalidateTaxIncomeRelated({ invalidateQueries } as never, { userId: "user-1" }),
		).resolves.toBeUndefined();
	});
});

describe("committedMutationEffects", () => {
	it("updates committed cache before starting background invalidations", () => {
		const calls: string[] = [];
		const queryClient = {
			setQueryData: vi.fn(() => calls.push("set")),
			invalidateQueries: vi.fn(async () => {
				calls.push("invalidate");
			}),
		} as never;

		const effects = committedMutationEffects(
			queryClient,
			{
				record: null,
				taxStatus: {
					status: "calculated",
					taxYear: 2026,
					evaluation: null,
					openAttentionCount: 0,
					monthlyPeriods: [],
				},
			},
			{ userId: "user-1" },
		);

		expect(effects.navigateNow).toBe(true);
		expect(calls[0]).toBe("set");
		expect(calls).toContain("invalidate");
	});

	it.each([
		["unpaid", "eligible"],
		["unsure", "eligible"],
		["activity_unsure", "eligible"],
		["not_mine", "already_decided"],
	] as const)("patches a %s candidate without losing its evidence", (decision, eligibility) => {
		let candidate: unknown;
		const queryClient = {
			setQueryData: vi.fn((key: readonly unknown[], updater: unknown) => {
				if (key[0] !== "documents" || typeof updater !== "function") return;
				candidate = updater({
					document: { id: "document-1" },
					processing: null,
					attention: null,
					taxIncomeCandidate: {
						eligibility: "eligible",
						issueDate: "2026-08-01",
						paymentTerms: "credit",
						dueDate: "2026-09-01",
						documentReportedPaymentDate: null,
						grossAmount: "100.00",
						withheldTaxAmount: "0.00",
						netPaidAmount: "100.00",
						payerName: "Cliente",
						decision: null,
						warnings: [],
					},
				});
			}),
			invalidateQueries: vi.fn(async () => undefined),
		} as never;

		committedMutationEffects(
			queryClient,
			{
				record: null,
				taxStatus: {
					status: "attention_required",
					taxYear: 2026,
					evaluation: null,
					openAttentionCount: 1,
					monthlyPeriods: [],
				},
			},
			{ userId: "user-1", documentId: "document-1", documentDecision: decision },
		);

		expect(candidate).toMatchObject({
			taxIncomeCandidate: {
				eligibility,
				decision,
				paymentTerms: "credit",
				dueDate: "2026-09-01",
			},
		});
	});

	it("marks a deleted detail in cache without removing the active query", () => {
		let updatedRecord: unknown;
		const removeQueries = vi.fn();
		const queryClient = {
			setQueryData: vi.fn((_key: unknown, updater: unknown) => {
				if (typeof updater === "function") {
					updatedRecord = updater({ id: "income-1", deletedAt: null });
				}
			}),
			removeQueries,
			invalidateQueries: vi.fn(async () => undefined),
		} as never;

		committedMutationEffects(
			queryClient,
			{
				taxStatus: {
					status: "calculated",
					taxYear: 2026,
					evaluation: null,
					openAttentionCount: 0,
					monthlyPeriods: [],
				},
			},
			{
				userId: "user-1",
				deletedRecord: { id: "income-1", deletedAt: "2026-08-22T12:00:00.000Z" },
			},
		);

		expect(updatedRecord).toMatchObject({
			id: "income-1",
			deletedAt: "2026-08-22T12:00:00.000Z",
		});
		expect(removeQueries).not.toHaveBeenCalled();
	});

	it("marks employment OCR evidence decided only after the server commits it", () => {
		let detail: unknown;
		const queryClient = {
			setQueryData: vi.fn((key: readonly unknown[], updater: unknown) => {
				if (key[0] !== "documents" || typeof updater !== "function") return;
				detail = updater({
					document: { id: "document-1" },
					processing: null,
					attention: null,
					employmentIncomeCandidate: {
						eligibility: "eligible",
						recordKind: "period",
						coverageStart: "2026-03-01",
						coverageEnd: "2026-03-31",
						coverageScope: "single_payer",
						grossAmount: "5000.00",
						withheldTaxAmount: "150.00",
						payerName: "ACME SAC",
						payerTaxId: "20123456789",
						verificationScope: "unverified_ocr_evidence",
						warnings: [],
					},
				});
			}),
			invalidateQueries: vi.fn(async () => undefined),
		} as never;

		committedMutationEffects(
			queryClient,
			{
				record: null,
				taxStatus: {
					status: "calculated",
					taxYear: 2026,
					evaluation: null,
					openAttentionCount: 0,
					monthlyPeriods: [],
				},
			},
			{
				userId: "user-1",
				documentId: "document-1",
				documentDecision: "employment_confirmed",
			},
		);

		expect(detail).toMatchObject({
			employmentIncomeCandidate: { eligibility: "already_decided" },
		});
	});
});
