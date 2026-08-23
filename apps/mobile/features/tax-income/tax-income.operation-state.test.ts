import { describe, expect, it } from "vitest";

import {
	selectVisibleTaxIncomeOperation,
	taxIncomeMutationFeedback,
	taxIncomeOperationCopy,
} from "./tax-income.operation-state";

describe("tax income operation state", () => {
	it("keeps a recoverable failure visible even when another write is pending", () => {
		expect(
			selectVisibleTaxIncomeOperation([
				{
					mutationId: 1,
					kind: "create",
					status: "error",
					submittedAt: 10,
					error: new Error("Sin conexión"),
				},
				{
					mutationId: 2,
					kind: "update",
					status: "pending",
					submittedAt: 20,
					error: null,
				},
			]),
		).toMatchObject({ mutationId: 1, status: "error" });
	});

	it("uses the newest pending operation when there are no failures", () => {
		expect(
			selectVisibleTaxIncomeOperation([
				{
					mutationId: 1,
					kind: "create",
					status: "pending",
					submittedAt: 10,
					error: null,
				},
				{
					mutationId: 2,
					kind: "delete",
					status: "pending",
					submittedAt: 20,
					error: null,
				},
			]),
		).toMatchObject({ mutationId: 2, kind: "delete" });
	});

	it("provides clear pending and retry copy without claiming the tax result changed", () => {
		expect(taxIncomeOperationCopy("create", "pending", null)).toEqual({
			message: "Guardando el ingreso en segundo plano…",
			canRetry: false,
		});
		expect(taxIncomeOperationCopy("delete", "error", new Error("Servidor no disponible"))).toEqual({
			message: "No pudimos eliminar el ingreso. Servidor no disponible",
			canRetry: true,
		});
	});

	it("does not fire destructive feedback until delete is confirmed", () => {
		expect(taxIncomeMutationFeedback("delete", "pending")).toBeNull();
		expect(taxIncomeMutationFeedback("delete", "success")).toBe("warning");
	});

	it("maps completed writes and failures to one global feedback intent", () => {
		expect(taxIncomeMutationFeedback("create", "success")).toBe("success");
		expect(taxIncomeMutationFeedback("document_decision", "success")).toBe("success");
		expect(taxIncomeMutationFeedback("update", "error")).toBe("error");
	});
});
