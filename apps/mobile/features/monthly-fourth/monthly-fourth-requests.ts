import type { MonthlyFourthReviewInput } from "./types";

export function monthlyFourthReviewRequest(input: MonthlyFourthReviewInput) {
	const { period, ...body } = input;
	return {
		path: `/v1/tax-periods/${encodeURIComponent(period)}/review`,
		body,
	} as const;
}
