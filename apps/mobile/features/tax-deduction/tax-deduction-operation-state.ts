import type { QueryClient } from "@tanstack/react-query";

import { taxDeductionKeys } from "./tax-deduction-keys";
import type { TaxDeductionCollection } from "./types";

export type TaxDeductionVisibleOperation = Readonly<{
	mutationId: number;
	status: "pending" | "error";
	submittedAt: number;
	error: unknown;
}>;

export function selectVisibleTaxDeductionOperation(
	operations: readonly TaxDeductionVisibleOperation[],
): TaxDeductionVisibleOperation | null {
	const errors = operations.filter((operation) => operation.status === "error");
	const candidates = errors.length > 0 ? errors : operations;
	return candidates.reduce<TaxDeductionVisibleOperation | null>(
		(latest, operation) =>
			latest === null || operation.submittedAt > latest.submittedAt ? operation : latest,
		null,
	);
}

export function createTaxDeductionSubmissionGate() {
	let locked = false;
	return {
		tryBegin: () => {
			if (locked) return false;
			locked = true;
			return true;
		},
		settle: () => {
			locked = false;
		},
	};
}

export function commitTaxDeductionCollection(
	queryClient: QueryClient,
	userId: string,
	collection: TaxDeductionCollection,
): void {
	queryClient.setQueryData(taxDeductionKeys.collection(userId, collection.taxYear), collection);
}

export async function retryTaxDeductionOperation(
	queryClient: QueryClient,
	mutationId: number,
): Promise<boolean> {
	const mutation = queryClient
		.getMutationCache()
		.getAll()
		.find((candidate) => candidate.mutationId === mutationId);
	if (!mutation || mutation.state.variables === undefined) return false;
	await mutation.execute(mutation.state.variables);
	return true;
}

export function taxDeductionOperationCopy(
	state: "pending" | "error",
	_error: Error | null,
): Readonly<{ message: string; canRetry: boolean }> {
	if (state === "pending") {
		return {
			message: "Estamos enviando tus respuestas. Puedes seguir revisándolas.",
			canRetry: false,
		};
	}
	return {
		message: "No pudimos guardar todavía. Tus respuestas siguen aquí.",
		canRetry: true,
	};
}
