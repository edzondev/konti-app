import { apiClient } from "@/core/api-client";

import type { CurrentTaxStatus, TaxEvaluation } from "./types";

export function getCurrentTaxStatus() {
	return apiClient<CurrentTaxStatus>("/v1/tax-status/current");
}

export function getTaxEvaluation(evaluationId: string) {
	return apiClient<TaxEvaluation>(`/v1/tax-evaluations/${evaluationId}`);
}
