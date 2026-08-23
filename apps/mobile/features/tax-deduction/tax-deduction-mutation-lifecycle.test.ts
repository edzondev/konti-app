import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { taxDeductionKeys } from "./tax-deduction-keys";
import {
	commitTaxDeductionCollection,
	createTaxDeductionSubmissionGate,
	retryTaxDeductionOperation,
	selectVisibleTaxDeductionOperation,
	taxDeductionOperationCopy,
} from "./tax-deduction-operation-state";
import { taxDeductionCollectionQueryConfig } from "./tax-deduction-query-config";
import { taxDeductionRequests } from "./tax-deduction-requests";
import type { SaveTaxDeductionInput, TaxDeductionCollection } from "./types";

const collection: TaxDeductionCollection = {
	taxYear: 2026,
	identityMasked: "***5678",
	summary: {
		includedDeductionPen: "90.00",
		potentialDeductionPen: "15.00",
		capPen: "16500.00",
		amountDiscardedByCapPen: "0.00",
		byCategory: {
			restaurants_hotels: "0.00",
			medical_dental_services: "0.00",
			other_fourth_services: "0.00",
			rent: "0.00",
			household_worker_essalud: "90.00",
		},
	},
	records: [],
};

const input: SaveTaxDeductionInput = {
	mode: "create",
	identity: null,
	deduction: {
		category: "household_worker_essalud",
		paidAt: "2026-08-20",
		grossAmountPen: "90.00",
		verificationBasis: "user_confirmation",
		sourceDocumentId: null,
		idempotencyKey: "deduction-request-1",
		requestedCalculationStatus: "included",
		requirements: [
			{ code: "worker_registration", status: "met" },
			{ code: "form_1676_evidence", status: "met" },
			{ code: "payment_recorded", status: "met" },
		],
		medical: null,
		fourthActivityType: null,
		rentAttribution: null,
	},
};

describe("tax deduction mutation lifecycle", () => {
	it("sends identity with the deduction command instead of a second request", () => {
		const requests = taxDeductionRequests({
			...input,
			identity: { dni: "12345678" },
		});

		expect(requests.identity).toBeNull();
		expect(requests.deduction.path).toBe("/v1/tax-deductions");
		expect(requests.deduction.body).toEqual(expect.objectContaining({ consumerDni: "12345678" }));
	});

	it("blocks a duplicate submit synchronously while navigation starts", () => {
		const gate = createTaxDeductionSubmissionGate();

		expect(gate.tryBegin()).toBe(true);
		expect(gate.tryBegin()).toBe(false);
		gate.settle();
		expect(gate.tryBegin()).toBe(true);
	});

	it("keeps the latest error visible over pending writes", () => {
		expect(
			selectVisibleTaxDeductionOperation([
				{ mutationId: 1, status: "pending", submittedAt: 20, error: null },
				{ mutationId: 2, status: "error", submittedAt: 10, error: new Error("offline") },
			]),
		).toMatchObject({ mutationId: 2, status: "error" });
	});

	it("targets one encoded record when reviewing an existing deduction", () => {
		const requests = taxDeductionRequests({
			...input,
			mode: "update",
			deductionId: "record/with spaces",
		});

		expect(requests.deduction).toEqual({
			path: "/v1/tax-deductions/record%2Fwith%20spaces",
			method: "PATCH",
			body: input.deduction,
		});
	});

	it("uses an authenticated user and tax year to enable the collection query", () => {
		const disabled = taxDeductionCollectionQueryConfig("", 2026);
		const enabled = taxDeductionCollectionQueryConfig("user-1", 2026);

		expect(disabled.enabled).toBe(false);
		expect(enabled.enabled).toBe(true);
		expect(enabled.queryKey).toEqual(taxDeductionKeys.collection("user-1", 2026));
	});

	it("commits only the server-returned collection", () => {
		const queryClient = new QueryClient();

		commitTaxDeductionCollection(queryClient, "user-1", collection);

		expect(queryClient.getQueryData(taxDeductionKeys.collection("user-1", 2026))).toEqual(
			collection,
		);
	});

	it("retries the exact idempotent variables after a transient error", async () => {
		const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
		const attempts: SaveTaxDeductionInput[] = [];
		const mutation = queryClient.getMutationCache().build(queryClient, {
			mutationKey: [...taxDeductionKeys.all, "write"],
			mutationFn: async (variables: SaveTaxDeductionInput) => {
				attempts.push(variables);
				if (attempts.length === 1) throw new Error("offline");
				return collection;
			},
		});

		await expect(mutation.execute(input)).rejects.toThrow("offline");
		await expect(retryTaxDeductionOperation(queryClient, mutation.mutationId)).resolves.toBe(true);
		expect(attempts).toEqual([input, input]);
	});

	it("keeps pending and retryable error copy neutral", () => {
		expect(taxDeductionOperationCopy("pending", null).message).toContain("enviando");
		expect(taxDeductionOperationCopy("error", new Error("secret server detail"))).toEqual({
			message: "No pudimos guardar todavía. Tus respuestas siguen aquí.",
			canRetry: true,
		});
	});

	it("does not execute a retry for an unknown mutation", async () => {
		const queryClient = new QueryClient();
		const mutationFn = vi.fn(async () => collection);
		queryClient.getMutationCache().build(queryClient, { mutationFn });

		await expect(retryTaxDeductionOperation(queryClient, 999_999)).resolves.toBe(false);
		expect(mutationFn).not.toHaveBeenCalled();
	});
});
