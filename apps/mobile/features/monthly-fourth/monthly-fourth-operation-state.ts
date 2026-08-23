import type { QueryClient } from "@tanstack/react-query";

import { monthlyFourthKeys } from "./monthly-fourth-keys";
import type { MonthlyFourthPeriod } from "./types";

export type MonthlyFourthMutationOutcome = "pending" | "success" | "error";

export type MonthlyFourthSubmissionGate = Readonly<{
	tryBegin: () => boolean;
	settle: () => void;
}>;

export function createMonthlyFourthSubmissionGate(): MonthlyFourthSubmissionGate {
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

export function monthlyFourthMutationFeedback(
	outcome: MonthlyFourthMutationOutcome,
): "success" | "error" | null {
	if (outcome === "pending") return null;
	return outcome;
}

export function monthlyFourthOperationCopy(
	status: "pending" | "error",
	error: unknown,
): { message: string; canRetry: boolean } {
	if (status === "pending") {
		return { message: "Guardando esta respuesta en segundo plano…", canRetry: false };
	}
	const detail = error instanceof Error && error.message.trim() ? ` ${error.message.trim()}` : "";
	return {
		message: `No pudimos guardar esta respuesta.${detail}`,
		canRetry: true,
	};
}

export function commitMonthlyFourthPeriod(
	queryClient: QueryClient,
	userId: string,
	period: MonthlyFourthPeriod,
): void {
	queryClient.setQueryData(monthlyFourthKeys.period(userId, period.period), period);
}

export async function retryMonthlyFourthOperation(
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
