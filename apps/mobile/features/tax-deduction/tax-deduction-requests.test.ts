import { describe, expect, it } from "vitest";

import { taxDeductionRequests } from "./tax-deduction-requests";
import type { SaveTaxDeductionInput } from "./types";

const deduction = {
	category: "restaurants_hotels",
	paidAt: "2026-08-20",
	grossAmountPen: "100.00",
	verificationBasis: "evidence_attached",
	sourceDocumentId: "33333333-3333-4333-8333-333333333333",
	idempotencyKey: "22222222-2222-4222-8222-222222222222",
	requestedCalculationStatus: "included",
	requirements: [
		{ code: "accepted_document", status: "met" },
		{ code: "consumer_identity_correct", status: "met" },
		{ code: "payment_recorded", status: "met" },
		{ code: "compatible_economic_activity", status: "met" },
		{ code: "issuer_active_and_habido", status: "met" },
		{ code: "issued_in_tax_year", status: "met" },
		{ code: "banking_evidence_when_required", status: "not_applicable" },
	],
	medical: null,
	fourthActivityType: null,
	rentAttribution: null,
} as const;

describe("taxDeductionRequests", () => {
	it("embeds an optional identity in the same manual command", () => {
		const requests = taxDeductionRequests({
			mode: "create",
			identity: { dni: "12345678" },
			deduction: { ...deduction, paidAt: "2026-07-02", sourceDocumentId: null },
		} as SaveTaxDeductionInput);

		expect(requests.identity).toBeNull();
		expect(requests.deduction).toEqual({
			path: "/v1/tax-deductions",
			method: "POST",
			body: expect.objectContaining({ consumerDni: "12345678", paidAt: "2026-07-02" }),
		});
	});
	it("uses document-decision when evidence comes from an OCR document", () => {
		const request = taxDeductionRequests({
			mode: "create",
			identity: null,
			deduction,
		} as SaveTaxDeductionInput).deduction;

		expect(request).toEqual({
			path: "/v1/tax-deductions/document-decision",
			method: "POST",
			body: expect.objectContaining({
				documentId: deduction.sourceDocumentId,
				decision: "deduction_confirmed",
				paidAt: "2026-08-20",
			}),
		});
		expect(request.body).not.toHaveProperty("sourceDocumentId");
		expect(request.body).not.toHaveProperty("idempotencyKey");
	});
});
