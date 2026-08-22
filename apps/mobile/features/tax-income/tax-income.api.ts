import { apiClient } from "@/core/api-client";

import type {
	CreateTaxIncomeInput,
	DeleteTaxIncomeResult,
	DocumentDecisionInput,
	DocumentDecisionResult,
	TaxIncomeMutationResult,
	TaxIncomePage,
	TaxIncomeRecord,
	UpdateTaxIncomeInput,
} from "./types";

export function getTaxIncomes(cursor?: string, year = 2026) {
	const params = new URLSearchParams({ year: String(year) });
	if (cursor) params.set("cursor", cursor);
	return apiClient<TaxIncomePage>(`/v1/tax-income-records?${params.toString()}`);
}

export function getTaxIncome(recordId: string) {
	return apiClient<TaxIncomeRecord>(`/v1/tax-income-records/${recordId}`);
}

export function createTaxIncome(input: CreateTaxIncomeInput) {
	return apiClient<TaxIncomeMutationResult>("/v1/tax-income-records", {
		method: "POST",
		body: input,
	});
}

export function updateTaxIncome(recordId: string, input: UpdateTaxIncomeInput) {
	return apiClient<TaxIncomeMutationResult>(`/v1/tax-income-records/${recordId}`, {
		method: "PATCH",
		body: input,
	});
}

export function deleteTaxIncome(recordId: string) {
	return apiClient<DeleteTaxIncomeResult>(`/v1/tax-income-records/${recordId}`, {
		method: "DELETE",
	});
}

export function decideDocumentIncome(input: DocumentDecisionInput) {
	return apiClient<DocumentDecisionResult>("/v1/tax-income-records/document-decision", {
		method: "POST",
		body: input,
	});
}
