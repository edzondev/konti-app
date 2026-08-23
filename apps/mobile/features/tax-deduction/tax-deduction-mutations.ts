import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { triggerHaptic } from "@/core/haptics";
import { homeKeys } from "@/features/home/home.queries";
import { taxStatusKeys } from "@/features/tax-status/tax-status.queries";

import { saveTaxDeduction } from "./tax-deduction-api";
import { taxDeductionKeys } from "./tax-deduction-keys";
import { commitTaxDeductionCollection } from "./tax-deduction-operation-state";
import type { TaxDeductionCollection } from "./types";

async function invalidateDeductionConsumers(
	queryClient: QueryClient,
	userId: string,
): Promise<void> {
	await Promise.allSettled([
		queryClient.invalidateQueries({ queryKey: taxStatusKeys.current(userId) }),
		queryClient.invalidateQueries({ queryKey: homeKeys.all }),
	]);
}

type TaxDeductionMutationCallbacks = Readonly<{
	onSuccess?: (collection: TaxDeductionCollection) => void;
	onError?: (error: Error) => void;
}>;

export function useSaveTaxDeduction(userId: string, callbacks: TaxDeductionMutationCallbacks = {}) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...taxDeductionKeys.all, "write"],
		meta: { operationKind: "save" },
		mutationFn: saveTaxDeduction,
		onSuccess: (collection) => {
			commitTaxDeductionCollection(queryClient, userId, collection);
			void invalidateDeductionConsumers(queryClient, userId);
			void triggerHaptic("success");
			callbacks.onSuccess?.(collection);
		},
		onError: (error) => {
			void triggerHaptic("error");
			callbacks.onError?.(error);
		},
	});
}
