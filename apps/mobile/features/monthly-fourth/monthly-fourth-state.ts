import type { MonthlyFourthPeriod, MonthlyFourthStatus, MonthlyRecordedFact } from "./types";

function requiredFactState(
	required: boolean,
	fact: MonthlyRecordedFact | null,
): "satisfied" | "negative" | "unknown" {
	if (!required) return "satisfied";
	if (!fact || fact.state === "unknown") return "unknown";
	return fact.state === "yes" ? "satisfied" : "negative";
}

export function safeMonthlyFourthStatus(period: MonthlyFourthPeriod): MonthlyFourthStatus {
	if (period.status !== "user_recorded_complete") return period.status;

	const filing = requiredFactState(period.requiresFilingReview, period.filing);
	const payment = requiredFactState(period.requiresPaymentReview, period.payment);
	if (filing === "negative" || payment === "negative") return "action_likely_required";
	if (filing === "unknown" || payment === "unknown") return "awaiting_user_confirmation";
	return "user_recorded_complete";
}
