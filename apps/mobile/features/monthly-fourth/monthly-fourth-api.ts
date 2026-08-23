import { apiClient } from "@/core/api-client";

import type { CurrentTaxStatus } from "@/features/tax-status/types";
import { monthlyFourthReviewRequest } from "./monthly-fourth-requests";
import type {
	MonthlyFourthMutationInput,
	MonthlyFourthPeriod,
	MonthlyFourthReviewInput,
} from "./types";

export function getMonthlyFourthPeriod(period: string) {
	return apiClient<MonthlyFourthPeriod>(`/v1/tax-periods/${encodeURIComponent(period)}`);
}

export function saveMonthlyFourthFact(input: MonthlyFourthMutationInput) {
	if (input.kind === "coverage" || input.kind === "activity") {
		return apiClient<MonthlyFourthPeriod>(`/v1/tax-periods/${encodeURIComponent(input.period)}`, {
			method: "PUT",
			body:
				input.kind === "coverage"
					? { coverage: input.coverage, idempotencyKey: input.idempotencyKey }
					: {
							activityClassification: input.activityClassification,
							idempotencyKey: input.idempotencyKey,
						},
		});
	}

	const path =
		input.kind === "suspension"
			? "/v1/tax-suspensions"
			: input.kind === "filing"
				? "/v1/tax-filings"
				: "/v1/tax-payments";
	const { kind: _kind, ...body } = input;
	return apiClient<MonthlyFourthPeriod>(path, { method: "POST", body });
}

export function saveMonthlyFourthReview(input: MonthlyFourthReviewInput) {
	const request = monthlyFourthReviewRequest(input);
	return apiClient<Readonly<{ period: MonthlyFourthPeriod; taxStatus: CurrentTaxStatus }>>(
		request.path,
		{ method: "POST", body: request.body },
	);
}
