import { describe, expect, it } from "vitest";
import { monthlyFourthReviewDefaults } from "./monthly-fourth.validation";
import { monthlyFourthMutationFromValues } from "./monthly-fourth-form";
import { safeMonthlyFourthStatus } from "./monthly-fourth-state";
import type { MonthlyFourthPeriod } from "./types";

function period(overrides: Partial<MonthlyFourthPeriod> = {}): MonthlyFourthPeriod {
	return {
		period: "2026-01",
		status: "user_recorded_complete",
		activityClassification: "ordinary",
		thresholdKind: "general",
		monthlyThreshold: "4010.00",
		monthlyFourthGross: "5000.00",
		monthlyFifthGross: "0.00",
		monthlyCombinedGross: "5000.00",
		registeredFourthWithholding: "0.00",
		unsuspendedFourthGross: "5000.00",
		estimatedAdvancePayment: "400.00",
		suspensionEffect: "none",
		suspensionEffectiveFrom: null,
		suspensionValidThrough: null,
		requiresFilingReview: true,
		requiresPaymentReview: true,
		officialCompliance: "not_determined",
		coverage: "complete",
		filing: {
			state: "yes",
			verificationScope: "user_provided",
		},
		payment: {
			state: "yes",
			verificationScope: "user_provided",
		},
		suspension: {
			state: "no",
			verificationScope: "user_provided",
			authorizationDate: null,
			effectiveFrom: null,
			validThrough: null,
			restartState: "not_required",
			restartDate: null,
		},
		reasons: [],
		...overrides,
	};
}

describe("safe monthly fourth presentation status", () => {
	it("keeps attention when a required declaration was recorded as no", () => {
		expect(
			safeMonthlyFourthStatus(
				period({
					filing: { state: "no", verificationScope: "user_provided" },
				}),
			),
		).toBe("action_likely_required");
	});

	it("keeps awaiting confirmation when a required payment is unknown", () => {
		expect(
			safeMonthlyFourthStatus(
				period({
					payment: { state: "unknown", verificationScope: null },
				}),
			),
		).toBe("awaiting_user_confirmation");
	});

	it("accepts user-recorded complete only when every required action is affirmative", () => {
		expect(safeMonthlyFourthStatus(period())).toBe("user_recorded_complete");
	});

	it("never promotes a server state on the client", () => {
		expect(safeMonthlyFourthStatus(period({ status: "action_likely_required" }))).toBe(
			"action_likely_required",
		);
		expect(safeMonthlyFourthStatus(period({ status: "no_action_detected" }))).toBe(
			"no_action_detected",
		);
	});
});

describe("monthly fourth form mutation", () => {
	it("records an explicit unknown activity instead of choosing a threshold", () => {
		expect(
			monthlyFourthMutationFromValues(
				"activity",
				{ ...monthlyFourthReviewDefaults, activityClassification: "unknown" },
				"2026-01",
				"activity-request",
			),
		).toEqual({
			kind: "activity",
			period: "2026-01",
			idempotencyKey: "activity-request",
			activityClassification: "unknown",
		});
	});

	it("records a negative filing separately without manufacturing filing details", () => {
		expect(
			monthlyFourthMutationFromValues(
				"filing",
				{ ...monthlyFourthReviewDefaults, filingAnswer: "no" },
				"2026-01",
				"filing-request",
			),
		).toEqual({
			kind: "filing",
			period: "2026-01",
			idempotencyKey: "filing-request",
			answer: "no",
			filedAt: null,
			confirmationNumber: null,
		});
	});

	it("normalizes a confirmed payment without changing the server calculation", () => {
		expect(
			monthlyFourthMutationFromValues(
				"payment",
				{
					...monthlyFourthReviewDefaults,
					paymentAnswer: "yes",
					paymentAmount: "320.8",
					paymentDate: "2026-02-10",
					paymentConfirmationCode: " PAY-1 ",
				},
				"2026-01",
				"payment-request",
			),
		).toEqual({
			kind: "payment",
			period: "2026-01",
			idempotencyKey: "payment-request",
			answer: "yes",
			amountPen: "320.80",
			paidAt: "2026-02-10",
			confirmationCode: "PAY-1",
		});
	});
});
