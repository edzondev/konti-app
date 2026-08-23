import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { createDevLogger } from "@/core/dev-logger";
import { triggerHaptic } from "@/core/haptics";
import { documentKeys } from "@/features/documents/documents.queries";
import type { DocumentDetail } from "@/features/documents/types";
import { homeKeys } from "@/features/home/home.queries";
import { taxStatusKeys } from "@/features/tax-status/tax-status.queries";
import type { CurrentTaxStatus } from "../tax-status/types";
import {
	createTaxIncome,
	decideDocumentIncome,
	deleteTaxIncome,
	resolveEmploymentCoverage,
	updateTaxIncome,
} from "./tax-income.api";
import { taxIncomeMutationFeedback } from "./tax-income.operation-state";
import {
	beginTaxIncomeCacheMutation,
	commitTaxIncomeCacheRecord,
	pendingDocumentTaxIncomeRecord,
	pendingTaxIncomeRecord,
	rollbackTaxIncomeCacheMutation,
} from "./tax-income.optimistic";
import { taxIncomeKeys } from "./tax-income.queries";
import type {
	CreateTaxIncomeInput,
	DocumentDecisionInput,
	TaxIncomeRecord,
	UpdateTaxIncomeInput,
} from "./types";

const performanceLog = createDevLogger("tax-income.performance");

function triggerMutationFeedback(
	kind: "create" | "update" | "delete",
	outcome: "success" | "error",
) {
	const intent = taxIncomeMutationFeedback(kind, outcome);
	if (intent) void triggerHaptic(intent);
}

export const taxIncomeMutationKeys = {
	all: ["tax-income-records", "write"] as const,
	create: ["tax-income-records", "write", "create"] as const,
	update: ["tax-income-records", "write", "update"] as const,
	delete: ["tax-income-records", "write", "delete"] as const,
	documentDecision: ["tax-income-records", "write", "document-decision"] as const,
	coverageResolution: ["tax-income-records", "write", "coverage-resolution"] as const,
};

type CreateTaxIncomeCallbacks = {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
};

type CommittedMutationContext = {
	userId: string;
	documentId?: string;
	documentDecision?: DocumentDecisionInput["decision"];
	deletedRecord?: { id: string; deletedAt: string };
};

type CommittedMutationResult = {
	taxStatus: CurrentTaxStatus;
	record?: TaxIncomeRecord | null;
};

export function committedMutationEffects(
	queryClient: QueryClient,
	result: CommittedMutationResult,
	context: CommittedMutationContext,
) {
	queryClient.setQueryData(taxStatusKeys.current(context.userId), result.taxStatus);

	if (result.record) {
		queryClient.setQueryData(taxIncomeKeys.detail(context.userId, result.record.id), result.record);
	}

	if (context.deletedRecord) {
		const deletedRecord = context.deletedRecord;
		queryClient.setQueryData<TaxIncomeRecord>(
			taxIncomeKeys.detail(context.userId, deletedRecord.id),
			(current) => (current ? { ...current, deletedAt: deletedRecord.deletedAt } : current),
		);
	}

	if (context.documentId) {
		queryClient.setQueryData<DocumentDetail>(
			documentKeys.detail(context.userId, context.documentId),
			(current) => {
				const decision = context.documentDecision;
				if (decision === "employment_confirmed" && current?.employmentIncomeCandidate) {
					return {
						...current,
						employmentIncomeCandidate: {
							...current.employmentIncomeCandidate,
							eligibility: "already_decided",
						},
					};
				}
				const fourthCandidate = current?.fourthIncomeCandidate ?? current?.taxIncomeCandidate;
				if (!current || !fourthCandidate) return current;
				const terminal = decision === "paid" || decision === "not_mine";
				return {
					...current,
					fourthIncomeCandidate: current.fourthIncomeCandidate
						? {
								...current.fourthIncomeCandidate,
								eligibility: terminal
									? "already_decided"
									: current.fourthIncomeCandidate.eligibility,
								decision:
									decision === "employment_confirmed"
										? null
										: (decision ?? current.fourthIncomeCandidate.decision),
							}
						: current.fourthIncomeCandidate,
					taxIncomeCandidate: {
						...fourthCandidate,
						eligibility: terminal ? "already_decided" : fourthCandidate.eligibility,
						decision:
							decision === "employment_confirmed" ? null : (decision ?? fourthCandidate.decision),
					},
				};
			},
		);
	}

	void invalidateTaxIncomeRelated(queryClient, context);
	return { navigateNow: true } as const;
}

export async function invalidateTaxIncomeRelated(
	queryClient: QueryClient,
	context: { userId: string; documentId?: string },
) {
	const invalidations = [
		queryClient.invalidateQueries({ queryKey: taxIncomeKeys.lists(context.userId) }),
		queryClient.invalidateQueries({ queryKey: taxStatusKeys.current(context.userId) }),
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

	const results = await Promise.allSettled(invalidations);
	const failedCount = results.filter((result) => result.status === "rejected").length;
	if (failedCount > 0) {
		performanceLog.warn("related_invalidations_failed", { failedCount });
	}
}

export function useCreateTaxIncome(userId: string, callbacks: CreateTaxIncomeCallbacks = {}) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: taxIncomeMutationKeys.create,
		meta: { operationKind: "create" },
		mutationFn: createTaxIncome,
		onMutate: (input: CreateTaxIncomeInput) => {
			const record = pendingTaxIncomeRecord(input, Date.now());
			return {
				...beginTaxIncomeCacheMutation(queryClient, userId, { kind: "create", record }),
				optimisticId: record.id,
			};
		},
		onSuccess: (result, _input, context) => {
			if (context?.optimisticId) {
				commitTaxIncomeCacheRecord(queryClient, userId, context.optimisticId, result.record);
			}
			committedMutationEffects(queryClient, result, { userId });
			triggerMutationFeedback("create", "success");
			callbacks.onSuccess?.();
		},
		onError: (error, _input, context) => {
			rollbackTaxIncomeCacheMutation(queryClient, context);
			triggerMutationFeedback("create", "error");
			callbacks.onError?.(error);
		},
	});
}

export function useUpdateTaxIncome(userId: string, recordId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: taxIncomeMutationKeys.update,
		meta: { operationKind: "update" },
		mutationFn: (input: UpdateTaxIncomeInput) => updateTaxIncome(recordId, input),
		onMutate: (input) =>
			beginTaxIncomeCacheMutation(queryClient, userId, { kind: "update", recordId, input }),
		onSuccess: (result) => {
			commitTaxIncomeCacheRecord(queryClient, userId, recordId, result.record);
			committedMutationEffects(queryClient, result, { userId });
			triggerMutationFeedback("update", "success");
		},
		onError: (_error, _input, context) => {
			rollbackTaxIncomeCacheMutation(queryClient, context);
			triggerMutationFeedback("update", "error");
		},
	});
}

export function useDeleteTaxIncome(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: taxIncomeMutationKeys.delete,
		meta: { operationKind: "delete" },
		mutationFn: deleteTaxIncome,
		onMutate: (recordId) =>
			beginTaxIncomeCacheMutation(queryClient, userId, { kind: "delete", recordId }),
		onSuccess: (result) => {
			committedMutationEffects(
				queryClient,
				{ taxStatus: result.taxStatus },
				{ userId, deletedRecord: result.record },
			);
			triggerMutationFeedback("delete", "success");
		},
		onError: (_error, _recordId, context) => {
			rollbackTaxIncomeCacheMutation(queryClient, context);
			triggerMutationFeedback("delete", "error");
		},
	});
}

export function useDecideDocumentIncome(userId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: taxIncomeMutationKeys.documentDecision,
		meta: { operationKind: "document_decision" },
		mutationFn: (input: DocumentDecisionInput) => decideDocumentIncome(input),
		onMutate: (input) => {
			if (input.decision !== "paid" && input.decision !== "employment_confirmed") return undefined;
			const record = pendingDocumentTaxIncomeRecord(input, Date.now());
			return {
				...beginTaxIncomeCacheMutation(queryClient, userId, { kind: "create", record }),
				optimisticId: record.id,
			};
		},
		onSuccess: (result, input, context) => {
			if (result.record && context?.optimisticId) {
				commitTaxIncomeCacheRecord(queryClient, userId, context.optimisticId, result.record);
			}
			committedMutationEffects(queryClient, result, {
				userId,
				documentId: input.documentId,
				documentDecision: input.decision,
			});
			void triggerHaptic(
				input.decision === "paid" ||
					input.decision === "employment_confirmed" ||
					input.decision === "not_mine"
					? "success"
					: "warning",
			);
		},
		onError: (_error, _input, context) => {
			rollbackTaxIncomeCacheMutation(queryClient, context);
			void triggerHaptic("error");
		},
	});
}

export function useResolveEmploymentCoverage(userId: string, recordId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: taxIncomeMutationKeys.coverageResolution,
		mutationFn: (input: import("./types").EmploymentCoverageResolutionInput) =>
			resolveEmploymentCoverage(recordId, input),
		onSuccess: (result) => {
			committedMutationEffects(queryClient, result, { userId });
			void triggerHaptic("success");
		},
		onError: () => {
			void triggerHaptic("error");
		},
	});
}
