import { describe, expect, it, vi } from "vitest";

import { taxStatusKeys } from "../tax-status/tax-status.queries";
import { invalidateTaxIncomeRelated } from "./tax-income.mutations";
import { taxIncomeKeys } from "./tax-income.queries";

vi.mock("./tax-income.api", () => ({
	createTaxIncome: vi.fn(),
	decideDocumentIncome: vi.fn(),
	deleteTaxIncome: vi.fn(),
	getTaxIncome: vi.fn(),
	getTaxIncomes: vi.fn(),
	updateTaxIncome: vi.fn(),
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
	it("keeps stable list and detail key families", () => {
		expect(taxIncomeKeys.all).toEqual(["tax-income-records"]);
		expect(taxIncomeKeys.lists()).toEqual(["tax-income-records", "list"]);
		expect(taxIncomeKeys.list(2026)).toEqual(["tax-income-records", "list", 2026]);
		expect(taxIncomeKeys.detail("income-1")).toEqual(["tax-income-records", "detail", "income-1"]);
		expect(taxStatusKeys.current).toEqual(["tax-status", "current"]);
	});
});

describe("invalidateTaxIncomeRelated", () => {
	it("invalidates tax, Home, and the source document after a document decision", async () => {
		const invalidateQueries = vi.fn(async () => undefined);

		await invalidateTaxIncomeRelated({ invalidateQueries } as never, {
			userId: "user-1",
			documentId: "document-1",
		});

		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: taxIncomeKeys.lists() });
		expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: taxIncomeKeys.all });
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: taxStatusKeys.current });
		expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["home"] });
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ["documents", "list", "user-1"],
		});
		expect(invalidateQueries).toHaveBeenCalledWith({
			queryKey: ["documents", "detail", "user-1", "document-1"],
		});
	});
});
