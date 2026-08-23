import { queryOptions } from "@tanstack/react-query";

import { getCurrentTaxStatus, getTaxEvaluation } from "./tax-status.api";
import { taxStatusKeys } from "./tax-status.keys";

export { taxStatusKeys } from "./tax-status.keys";

export const currentTaxStatusQueryOptions = (userId: string) =>
	queryOptions({
		queryKey: taxStatusKeys.current(userId),
		queryFn: getCurrentTaxStatus,
		enabled: Boolean(userId),
	});

export const taxEvaluationQueryOptions = (userId: string, evaluationId: string) =>
	queryOptions({
		queryKey: taxStatusKeys.evaluation(userId, evaluationId),
		queryFn: () => getTaxEvaluation(evaluationId),
		enabled: Boolean(userId && evaluationId),
	});
