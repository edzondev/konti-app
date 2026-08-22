import { queryOptions } from "@tanstack/react-query";

import { getCurrentTaxStatus, getTaxEvaluation } from "./tax-status.api";

export const taxStatusKeys = {
	current: ["tax-status", "current"] as const,
	evaluation: (id: string) => ["tax-status", "evaluation", id] as const,
};

export const currentTaxStatusQueryOptions = (userId: string) =>
	queryOptions({
		queryKey: taxStatusKeys.current,
		queryFn: getCurrentTaxStatus,
		enabled: Boolean(userId),
	});

export const taxEvaluationQueryOptions = (userId: string, evaluationId: string) =>
	queryOptions({
		queryKey: taxStatusKeys.evaluation(evaluationId),
		queryFn: () => getTaxEvaluation(evaluationId),
		enabled: Boolean(userId && evaluationId),
	});
