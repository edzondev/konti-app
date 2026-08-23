import { apiClient } from "@/core/api-client";
import { createDevLogger } from "@/core/dev-logger";

import type {
	CreateTaxIncomeInput,
	DeleteTaxIncomeResult,
	DocumentDecisionInput,
	DocumentDecisionResult,
	EmploymentCoverageResolutionInput,
	TaxIncomeFilter,
	TaxIncomeMutationResult,
	TaxIncomePage,
	TaxIncomeRecord,
	UpdateTaxIncomeInput,
} from "./types";

const performanceLog = createDevLogger("tax-income.performance");

export function getTaxIncomes(cursor?: string, year = 2026, filter: TaxIncomeFilter = "all") {
	const params = new URLSearchParams({ year: String(year) });
	if (cursor) params.set("cursor", cursor);
	params.set("type", filter);
	return apiClient<TaxIncomePage>(`/v1/tax-income-records?${params.toString()}`);
}

export function getTaxIncome(recordId: string) {
	return apiClient<TaxIncomeRecord>(`/v1/tax-income-records/${recordId}`);
}

export async function createTaxIncome(input: CreateTaxIncomeInput) {
	const startedAt = Date.now();
	let succeeded = false;

	try {
		const result = await apiClient<TaxIncomeMutationResult>("/v1/tax-income-records", {
			method: "POST",
			body: input,
		});
		succeeded = true;
		return result;
	} finally {
		performanceLog.info("create:post_finished", {
			durationMs: Date.now() - startedAt,
			succeeded,
		});
	}
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

export function resolveEmploymentCoverage(
	recordId: string,
	input: EmploymentCoverageResolutionInput,
) {
	return apiClient<TaxIncomeMutationResult>(
		`/v1/tax-income-records/${recordId}/coverage-resolution`,
		{
			method: "POST",
			body: input,
		},
	);
}
