export type TaxIncomeOperationKind = "create" | "update" | "delete" | "document_decision";
export type TaxIncomeOperationOutcome = "pending" | "success" | "error";
export type TaxIncomeOperationFeedback = "success" | "warning" | "error";

export type TaxIncomeVisibleOperation = {
	mutationId: number;
	kind: TaxIncomeOperationKind;
	status: "pending" | "error";
	submittedAt: number;
	error: unknown;
};

export function selectVisibleTaxIncomeOperation(
	operations: TaxIncomeVisibleOperation[],
): TaxIncomeVisibleOperation | null {
	const failures = operations.filter((operation) => operation.status === "error");
	const candidates = failures.length > 0 ? failures : operations;
	return candidates.reduce<TaxIncomeVisibleOperation | null>(
		(latest, operation) =>
			latest === null || operation.submittedAt > latest.submittedAt ? operation : latest,
		null,
	);
}

export function taxIncomeOperationCopy(
	kind: TaxIncomeOperationKind,
	status: "pending" | "error",
	error: unknown,
) {
	if (status === "pending") {
		return {
			message:
				kind === "delete"
					? "Eliminando el ingreso en segundo plano…"
					: kind === "document_decision"
						? "Guardando tu respuesta en segundo plano…"
						: "Guardando el ingreso en segundo plano…",
			canRetry: false,
		};
	}

	const detail = error instanceof Error && error.message.trim() ? ` ${error.message.trim()}` : "";
	return {
		message:
			kind === "delete"
				? `No pudimos eliminar el ingreso.${detail}`
				: kind === "document_decision"
					? `No pudimos guardar tu respuesta.${detail}`
					: `No pudimos guardar el ingreso.${detail}`,
		canRetry: true,
	};
}

export function taxIncomeMutationFeedback(
	kind: TaxIncomeOperationKind,
	outcome: TaxIncomeOperationOutcome,
): TaxIncomeOperationFeedback | null {
	if (outcome === "pending") return null;
	if (outcome === "error") return "error";
	return kind === "delete" ? "warning" : "success";
}
