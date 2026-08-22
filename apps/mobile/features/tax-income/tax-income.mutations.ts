import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { documentKeys } from "@/features/documents/documents.queries";
import { homeKeys } from "@/features/home/home.queries";
import { taxStatusKeys } from "@/features/tax-status/tax-status.queries";

import {
	createTaxIncome,
	decideDocumentIncome,
	deleteTaxIncome,
	updateTaxIncome,
} from "./tax-income.api";
import { taxIncomeKeys } from "./tax-income.queries";
import type { DocumentDecisionInput, UpdateTaxIncomeInput } from "./types";

export async function invalidateTaxIncomeRelated(
	queryClient: QueryClient,
	context: { userId: string; documentId?: string },
) {
	const invalidations = [
		queryClient.invalidateQueries({ queryKey: taxIncomeKeys.lists() }),
		queryClient.invalidateQueries({ queryKey: taxStatusKeys.current }),
		queryClient.invalidateQueries({ queryKey: homeKeys.all }),
	];

	if (context.documentId) {
		invalidations.push(
			queryClient.invalidateQueries({ queryKey: documentKeys.list(context.userId) }),
			queryClient.invalidateQueries({
				queryKey: documentKeys.detail(context.userId, context.documentId),
			}),
		);
	}

	await Promise.all(invalidations);
}

export function useCreateTaxIncome(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTaxIncome,
		onSuccess: async (result) => {
			queryClient.setQueryData(taxStatusKeys.current, result.taxStatus);
			await invalidateTaxIncomeRelated(queryClient, { userId });
		},
	});
}

export function useUpdateTaxIncome(userId: string, recordId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateTaxIncomeInput) => updateTaxIncome(recordId, input),
		onSuccess: async (result) => {
			queryClient.setQueryData(taxIncomeKeys.detail(recordId), result.record);
			queryClient.setQueryData(taxStatusKeys.current, result.taxStatus);
			await invalidateTaxIncomeRelated(queryClient, { userId });
		},
	});
}

export function useDeleteTaxIncome(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteTaxIncome,
		onSuccess: async (result) => {
			queryClient.setQueryData(taxStatusKeys.current, result.taxStatus);
			await invalidateTaxIncomeRelated(queryClient, { userId });
		},
	});
}

export function useDecideDocumentIncome(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: DocumentDecisionInput) => decideDocumentIncome(input),
		onSuccess: async (result, input) => {
			queryClient.setQueryData(taxStatusKeys.current, result.taxStatus);
			await invalidateTaxIncomeRelated(queryClient, {
				userId,
				documentId: input.documentId,
			});
		},
	});
}
