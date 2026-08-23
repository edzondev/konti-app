import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { monthlyFourthReviewFromValues } from "./monthly-fourth-form";
import { monthlyFourthKeys } from "./monthly-fourth-keys";
import {
	commitMonthlyFourthPeriod,
	createMonthlyFourthSubmissionGate,
	monthlyFourthMutationFeedback,
	monthlyFourthOperationCopy,
	retryMonthlyFourthOperation,
} from "./monthly-fourth-operation-state";
import { monthlyFourthReviewRequest } from "./monthly-fourth-requests";
import type {
	MonthlyFourthMutationInput,
	MonthlyFourthPeriod,
	MonthlyFourthReviewInput,
} from "./types";

const period: MonthlyFourthPeriod = {
	period: "2026-01",
	status: "action_likely_required",
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
	filing: null,
	payment: null,
	suspension: null,
	reasons: ["monthly_action_likely"],
};

describe("monthly fourth mutation lifecycle", () => {
	it("builds one atomic command for all wizard answers", () => {
		const input = monthlyFourthReviewFromValues(
			{
				coverage: "complete",
				activityClassification: "ordinary",
				suspensionAnswer: "yes",
				suspensionAuthorizationDate: "2026-02-01",
				restartAnswer: "required",
				restartDate: "2026-02-10",
				filingAnswer: "yes",
				filingDate: "2026-02-10",
				filingConfirmationNumber: "616-1",
				paymentAnswer: "yes",
				paymentAmount: "400",
				paymentDate: "2026-02-10",
				paymentConfirmationCode: "pay-1",
			},
			"2026-01",
			"22222222-2222-4222-8222-222222222222",
		);

		expect(input).toEqual({
			period: "2026-01",
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
			coverage: "complete",
			activityClassification: "ordinary",
			suspension: {
				answer: "yes",
				authorizationDate: "2026-02-01",
				restartState: "required",
				restartDate: "2026-02-10",
			},
			filing: { answer: "yes", filedAt: "2026-02-10", confirmationNumber: "616-1" },
			payment: {
				answer: "yes",
				amountPen: "400.00",
				paidAt: "2026-02-10",
				confirmationCode: "pay-1",
			},
		});
	});

	it("targets the atomic review endpoint without duplicating the period in the body", () => {
		const request = monthlyFourthReviewRequest({
			period: "2026-01",
			idempotencyKey: "22222222-2222-4222-8222-222222222222",
			coverage: "complete",
			activityClassification: "ordinary",
			suspension: null,
			filing: { answer: "no", filedAt: null, confirmationNumber: null },
			payment: { answer: "no", amountPen: null, paidAt: null, confirmationCode: null },
		});

		expect(request.path).toBe("/v1/tax-periods/2026-01/review");
		expect(request.body).not.toHaveProperty("period");
	});
	it("blocks a second tap synchronously until the attempt settles", () => {
		const gate = createMonthlyFourthSubmissionGate();

		expect(gate.tryBegin()).toBe(true);
		expect(gate.tryBegin()).toBe(false);
		gate.settle();
		expect(gate.tryBegin()).toBe(true);
	});

	it("commits the confirmed response to cache synchronously", () => {
		const queryClient = new QueryClient();

		commitMonthlyFourthPeriod(queryClient, "user-1", period);

		expect(queryClient.getQueryData(monthlyFourthKeys.period("user-1", "2026-01"))).toEqual(period);
	});

	it("retries the same idempotent input after an error", async () => {
		const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
		const attempts: MonthlyFourthMutationInput[] = [];
		const input: MonthlyFourthMutationInput = {
			kind: "coverage",
			period: "2026-01",
			coverage: "complete",
			idempotencyKey: "same-request",
		};
		const mutation = queryClient.getMutationCache().build(queryClient, {
			mutationKey: ["monthly-fourth", "write"],
			mutationFn: async (variables: MonthlyFourthMutationInput) => {
				attempts.push(variables);
				if (attempts.length === 1) throw new Error("offline");
				return period;
			},
		});

		await expect(mutation.execute(input)).rejects.toThrow("offline");
		await expect(retryMonthlyFourthOperation(queryClient, mutation.mutationId)).resolves.toBe(true);

		expect(attempts).toEqual([input, input]);
	});

	it("retries the exact atomic review command after navigation", async () => {
		const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
		const attempts: MonthlyFourthReviewInput[] = [];
		const input = {
			period: "2026-01",
			idempotencyKey: "same-root-request",
			coverage: "complete",
			activityClassification: "ordinary",
			suspension: null,
			filing: { answer: "no", filedAt: null, confirmationNumber: null },
			payment: { answer: "no", amountPen: null, paidAt: null, confirmationCode: null },
		} as MonthlyFourthReviewInput;
		const mutation = queryClient.getMutationCache().build(queryClient, {
			mutationKey: ["monthly-fourth", "review"],
			mutationFn: async (variables: MonthlyFourthReviewInput) => {
				attempts.push(variables);
				if (attempts.length === 1) throw new Error("offline");
				return { period, taxStatus: { status: "calculated" } };
			},
		});

		await expect(mutation.execute(input)).rejects.toThrow("offline");
		await retryMonthlyFourthOperation(queryClient, mutation.mutationId);
		expect(attempts).toEqual([input, input]);
	});

	it("shows pending and recoverable error states without claiming completion", () => {
		expect(monthlyFourthOperationCopy("pending", null)).toEqual({
			message: "Guardando esta respuesta en segundo plano…",
			canRetry: false,
		});
		expect(monthlyFourthOperationCopy("error", new Error("Sin conexión"))).toEqual({
			message: "No pudimos guardar esta respuesta. Sin conexión",
			canRetry: true,
		});
	});

	it("emits haptics only after the server confirms or rejects the write", () => {
		expect(monthlyFourthMutationFeedback("pending")).toBeNull();
		expect(monthlyFourthMutationFeedback("success")).toBe("success");
		expect(monthlyFourthMutationFeedback("error")).toBe("error");
	});
});
