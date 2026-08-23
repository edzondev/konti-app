import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { triggerHaptic } from "@/core/haptics";
import { homeKeys } from "@/features/home/home.queries";
import { taxStatusKeys } from "@/features/tax-status/tax-status.queries";

import { saveMonthlyFourthFact, saveMonthlyFourthReview } from "./monthly-fourth-api";
import { commitMonthlyFourthPeriod } from "./monthly-fourth-operation-state";
import { monthlyFourthKeys } from "./monthly-fourth-queries";
import type { MonthlyFourthPeriod } from "./types";

async function invalidateMonthlyFourthRelated(
	queryClient: QueryClient,
	userId: string,
): Promise<void> {
	await Promise.allSettled([
		queryClient.invalidateQueries({ queryKey: taxStatusKeys.current(userId) }),
		queryClient.invalidateQueries({ queryKey: homeKeys.all }),
	]);
}

type MonthlyFourthMutationCallbacks = {
	onSuccess?: (period: MonthlyFourthPeriod) => void;
	onError?: (error: Error) => void;
};

export function useSaveMonthlyFourthFact(
	userId: string,
	callbacks: MonthlyFourthMutationCallbacks = {},
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: [...monthlyFourthKeys.all, "write"],
		mutationFn: saveMonthlyFourthFact,
		onSuccess: (period) => {
			commitMonthlyFourthPeriod(queryClient, userId, period);
			void invalidateMonthlyFourthRelated(queryClient, userId);
			void triggerHaptic("success");
			callbacks.onSuccess?.(period);
		},
		onError: (error) => {
			void triggerHaptic("error");
			callbacks.onError?.(error);
		},
	});
}

export function useSaveMonthlyFourthReview(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...monthlyFourthKeys.all, "review"],
		meta: { operationKind: "review" },
		mutationFn: saveMonthlyFourthReview,
		onSuccess: (result) => {
			commitMonthlyFourthPeriod(queryClient, userId, result.period);
			queryClient.setQueryData(taxStatusKeys.current(userId), result.taxStatus);
			void queryClient.invalidateQueries({ queryKey: homeKeys.all });
			void triggerHaptic("success");
		},
		onError: () => {
			void triggerHaptic("error");
		},
	});
}
