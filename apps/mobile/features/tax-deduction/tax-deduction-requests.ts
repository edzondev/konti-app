import type { SaveTaxDeductionInput } from "./types";

export type TaxDeductionRequest = Readonly<{
	path: string;
	method: "POST" | "PUT" | "PATCH";
	body: unknown;
}>;

export function taxDeductionRequests(input: SaveTaxDeductionInput): Readonly<{
	identity: TaxDeductionRequest | null;
	deduction: TaxDeductionRequest;
}> {
	const identity = null;
	const body = input.identity
		? { ...input.deduction, consumerDni: input.identity.dni }
		: input.deduction;
	const deduction =
		input.mode === "update" && input.deductionId
			? {
					path: `/v1/tax-deductions/${encodeURIComponent(input.deductionId)}`,
					method: "PATCH" as const,
					body,
				}
			: input.deduction.sourceDocumentId
				? {
						path: "/v1/tax-deductions/document-decision",
						method: "POST" as const,
						body: documentDecisionBody(body),
					}
				: {
						path: "/v1/tax-deductions",
						method: "POST" as const,
						body,
					};
	return { identity, deduction };
}

function documentDecisionBody(
	input: SaveTaxDeductionInput["deduction"] & { consumerDni?: string },
) {
	const { sourceDocumentId, idempotencyKey: _idempotencyKey, ...deduction } = input;
	return {
		...deduction,
		documentId: sourceDocumentId,
		decision: "deduction_confirmed" as const,
	};
}
