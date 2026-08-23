import { describe, expect, it, vi } from "vitest";

import { monthlyFourthPeriodSchema, monthlyFourthReviewSchema } from "./monthly-fourth.validation";

const validReview = {
	coverage: "complete",
	activityClassification: "ordinary",
	suspensionAnswer: "no",
	suspensionAuthorizationDate: "",
	restartAnswer: "not_required",
	restartDate: "",
	filingAnswer: "yes",
	filingDate: "2026-02-10",
	filingConfirmationNumber: "616-123",
	paymentAnswer: "yes",
	paymentAmount: "320.80",
	paymentDate: "2026-02-10",
	paymentConfirmationCode: "PAY-123",
} as const;

describe("monthly fourth review validation", () => {
	it("accepts only a 2026 calendar period", () => {
		expect(monthlyFourthPeriodSchema.safeParse("2026-01").success).toBe(true);
		expect(monthlyFourthPeriodSchema.safeParse("2026-12").success).toBe(true);
		expect(monthlyFourthPeriodSchema.safeParse("2025-12").success).toBe(false);
		expect(monthlyFourthPeriodSchema.safeParse("2026-13").success).toBe(false);
	});

	it("requires an authorization date only when the user reports a suspension", () => {
		const missingDate = monthlyFourthReviewSchema.safeParse({
			...validReview,
			suspensionAnswer: "yes",
		});
		const unknown = monthlyFourthReviewSchema.safeParse({
			...validReview,
			suspensionAnswer: "unknown",
		});

		expect(missingDate.success).toBe(false);
		expect(unknown.success).toBe(true);
		if (!missingDate.success) {
			expect(missingDate.error.flatten().fieldErrors.suspensionAuthorizationDate).toContain(
				"Ingresa la fecha que figura en la autorización.",
			);
		}
	});

	it("requires a restart date after suspension became effective", () => {
		const missingRestart = monthlyFourthReviewSchema.safeParse({
			...validReview,
			suspensionAnswer: "yes",
			suspensionAuthorizationDate: "2026-01-10",
			restartAnswer: "required",
		});
		const beforeEffectiveDate = monthlyFourthReviewSchema.safeParse({
			...validReview,
			suspensionAnswer: "yes",
			suspensionAuthorizationDate: "2026-01-10",
			restartAnswer: "required",
			restartDate: "2026-01-10",
		});
		const validRestart = monthlyFourthReviewSchema.safeParse({
			...validReview,
			suspensionAnswer: "yes",
			suspensionAuthorizationDate: "2026-01-10",
			restartAnswer: "required",
			restartDate: "2026-01-11",
		});

		expect(missingRestart.success).toBe(false);
		expect(beforeEffectiveDate.success).toBe(false);
		expect(validRestart.success).toBe(true);
	});

	it("keeps filing and payment requirements independent", () => {
		const filingMissingDate = monthlyFourthReviewSchema.safeParse({
			...validReview,
			filingDate: "",
		});
		const paymentMissingEvidence = monthlyFourthReviewSchema.safeParse({
			...validReview,
			paymentAmount: "0.00",
			paymentDate: "",
		});
		const bothNegative = monthlyFourthReviewSchema.safeParse({
			...validReview,
			filingAnswer: "no",
			filingDate: "",
			paymentAnswer: "unknown",
			paymentAmount: "",
			paymentDate: "",
		});

		expect(filingMissingDate.success).toBe(false);
		expect(paymentMissingEvidence.success).toBe(false);
		expect(bothNegative.success).toBe(true);
	});

	it("rejects future filing and payment dates but accepts later-year facts once they occurred", () => {
		vi.useFakeTimers().setSystemTime(new Date("2026-08-23T17:00:00.000Z"));
		try {
			const futureFacts = monthlyFourthReviewSchema.safeParse({
				...validReview,
				filingDate: "2027-01-12",
				paymentDate: "2027-01-13",
			});
			expect(futureFacts.success).toBe(false);

			vi.setSystemTime(new Date("2027-02-01T17:00:00.000Z"));
			const occurredFacts = monthlyFourthReviewSchema.safeParse({
				...validReview,
				filingDate: "2027-01-12",
				paymentDate: "2027-01-13",
			});
			expect(occurredFacts.success).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});

	it("keeps suspension authorization and restart inside 2026", () => {
		const outOfScopeSuspension = monthlyFourthReviewSchema.safeParse({
			...validReview,
			suspensionAnswer: "yes",
			suspensionAuthorizationDate: "2027-01-01",
			restartAnswer: "not_required",
		});

		expect(outOfScopeSuspension.success).toBe(false);
	});

	it("rejects suspension authorization and restart dates that have not occurred in Lima", () => {
		vi.useFakeTimers().setSystemTime(new Date("2026-08-23T17:00:00.000Z"));
		try {
			const futureAuthorization = monthlyFourthReviewSchema.safeParse({
				...validReview,
				suspensionAnswer: "yes",
				suspensionAuthorizationDate: "2026-08-24",
				restartAnswer: "not_required",
			});
			const futureRestart = monthlyFourthReviewSchema.safeParse({
				...validReview,
				suspensionAnswer: "yes",
				suspensionAuthorizationDate: "2026-08-22",
				restartAnswer: "required",
				restartDate: "2026-08-24",
			});

			expect(futureAuthorization.success).toBe(false);
			expect(futureRestart.success).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it("does not default an unknown activity to the more favorable threshold", () => {
		const unknown = monthlyFourthReviewSchema.parse({
			...validReview,
			activityClassification: "unknown",
		});

		expect(unknown.activityClassification).toBe("unknown");
	});
});
