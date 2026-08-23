import { apiClient } from "@/core/api-client";
import { parseTaxDeductionCollection } from "./tax-deduction-contract";
import { taxDeductionRequests } from "./tax-deduction-requests";
import type { SaveTaxDeductionInput } from "./types";

export async function getTaxDeductionCollection(taxYear: number) {
	return parseTaxDeductionCollection(
		await apiClient<unknown>(`/v1/tax-deductions?taxYear=${taxYear}`),
	);
}

export async function saveTaxDeduction(input: SaveTaxDeductionInput) {
	const requests = taxDeductionRequests(input);
	if (requests.identity) {
		await apiClient<Readonly<{ configured: true; identityMasked: string }>>(
			requests.identity.path,
			{
				method: requests.identity.method,
				body: requests.identity.body,
			},
		);
	}
	return parseTaxDeductionCollection(
		await apiClient<unknown>(requests.deduction.path, {
			method: requests.deduction.method,
			body: requests.deduction.body,
		}),
	);
}
