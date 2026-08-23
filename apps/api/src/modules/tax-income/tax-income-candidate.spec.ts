import { buildFourthIncomeAttention, deriveFourthIncomeCandidate } from "./tax-income-candidate";

const base = {
	documentType: "fee_receipt" as const,
	status: "ready" as const,
	issueDate: "2026-08-12",
	currencyCode: "PEN",
	hasActiveIncome: false,
	decision: null,
	normalizedResult: {
		paymentTerms: "cash",
		dueDate: null,
		actualPaymentDate: "2026-08-20",
		grossFeeAmount: "2500.00",
		incomeTaxWithheldAmount: "200.00",
		netPaidAmount: "2300.00",
		payerName: "Cliente SAC",
		taxAmount: "450.00",
	},
};

describe("deriveFourthIncomeCandidate", () => {
	it("returns an eligible semantic RHE candidate", () => {
		expect(deriveFourthIncomeCandidate(base)).toEqual({
			eligibility: "eligible",
			issueDate: "2026-08-12",
			paymentTerms: "cash",
			dueDate: null,
			documentReportedPaymentDate: "2026-08-20",
			grossAmount: "2500.00",
			withheldTaxAmount: "200.00",
			netPaidAmount: "2300.00",
			payerName: "Cliente SAC",
			decision: null,
			warnings: [],
		});
	});

	it("keeps collection empty without making the candidate ineligible", () => {
		const candidate = deriveFourthIncomeCandidate({
			...base,
			normalizedResult: { ...base.normalizedResult, actualPaymentDate: null },
		});

		expect(candidate).toMatchObject({
			eligibility: "eligible",
			issueDate: "2026-08-12",
			documentReportedPaymentDate: null,
			warnings: [],
		});
	});

	it("exposes a credit due date without treating it as collection", () => {
		const candidate = deriveFourthIncomeCandidate({
			...base,
			normalizedResult: {
				...base.normalizedResult,
				paymentTerms: "credit",
				dueDate: "2026-09-10",
				actualPaymentDate: null,
			},
		});

		expect(candidate).toMatchObject({
			eligibility: "eligible",
			paymentTerms: "credit",
			dueDate: "2026-09-10",
			documentReportedPaymentDate: null,
		});
	});

	it("does not use generic taxAmount as income-tax withholding", () => {
		const candidate = deriveFourthIncomeCandidate({
			...base,
			normalizedResult: {
				...base.normalizedResult,
				incomeTaxWithheldAmount: null,
				taxAmount: "450.00",
			},
		});

		expect(candidate).toMatchObject({
			eligibility: "insufficient_fields",
			withheldTaxAmount: null,
			warnings: ["missing_withholding_amount"],
		});
	});

	it("marks non-PEN and previously decided receipts without losing extracted values", () => {
		expect(deriveFourthIncomeCandidate({ ...base, currencyCode: "USD" })).toMatchObject({
			eligibility: "unsupported_currency",
		});
		expect(deriveFourthIncomeCandidate({ ...base, hasActiveIncome: true })).toMatchObject({
			eligibility: "already_decided",
		});
		expect(deriveFourthIncomeCandidate({ ...base, decision: "not_mine" })).toMatchObject({
			eligibility: "already_decided",
		});
	});

	it.each(["unpaid", "unsure"] as const)(
		"keeps a %s receipt actionable for later collection confirmation",
		(decision) => {
			expect(deriveFourthIncomeCandidate({ ...base, decision })).toMatchObject({
				eligibility: "eligible",
				decision,
			});
		},
	);

	it("keeps an unknown activity classification actionable without creating an income", () => {
		expect(deriveFourthIncomeCandidate({ ...base, decision: "activity_unsure" })).toMatchObject({
			eligibility: "eligible",
			decision: "activity_unsure",
		});
	});

	it("returns null for a document that is not a fee receipt", () => {
		expect(deriveFourthIncomeCandidate({ ...base, documentType: "invoice" })).toBeNull();
	});
});

describe("buildFourthIncomeAttention", () => {
	it("builds one deduplicated confirmation action for a fee receipt", () => {
		expect(
			buildFourthIncomeAttention({
				taxProfileId: "11111111-1111-4111-8111-111111111111",
				documentId: "33333333-3333-4333-8333-333333333333",
				documentType: "fee_receipt",
				currencyCode: "PEN",
			}),
		).toMatchObject({
			source: "document_processing",
			itemType: "confirm_fourth_income",
			status: "open",
			actionType: "confirm_fourth_income",
			deduplicationKey: "fourth-income:33333333-3333-4333-8333-333333333333",
			actionPayload: {
				documentId: "33333333-3333-4333-8333-333333333333",
			},
		});
	});

	it("does not create fourth-income attention for other document types", () => {
		expect(
			buildFourthIncomeAttention({
				taxProfileId: "11111111-1111-4111-8111-111111111111",
				documentId: "33333333-3333-4333-8333-333333333333",
				documentType: "invoice",
				currencyCode: "PEN",
			}),
		).toBeNull();
	});

	it("does not create an unresolvable attention item for unsupported currency", () => {
		expect(
			buildFourthIncomeAttention({
				taxProfileId: "11111111-1111-4111-8111-111111111111",
				documentId: "33333333-3333-4333-8333-333333333333",
				documentType: "fee_receipt",
				currencyCode: "USD",
			}),
		).toBeNull();
	});
});
