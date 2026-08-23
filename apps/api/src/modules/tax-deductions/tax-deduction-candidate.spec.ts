import { deriveTaxDeductionCandidate } from "./tax-deduction-candidate";

describe("deriveTaxDeductionCandidate", () => {
	it("turns same-call OCR evidence into a potential candidate, never verified", () => {
		expect(
			deriveTaxDeductionCandidate({
				documentStatus: "ready",
				documentType: "receipt",
				issueDate: "2026-08-20",
				currencyCode: "PEN",
				hasActiveDeduction: false,
				consumerIdentityEvidence: "matches",
				normalizedResult: {
					deductionCategoryHint: "restaurants_hotels",
					amountPaid: "100.00",
					serviceDescription: "Consumo",
				},
			}),
		).toMatchObject({
			categoryHint: "restaurants_hotels",
			issueDate: "2026-08-20",
			grossAmount: "100.00",
			verificationStatus: "evidence_attached",
			calculationStatus: "potential",
			consumerIdentityEvidence: "matches",
		});
		expect(
			deriveTaxDeductionCandidate({
				documentStatus: "ready",
				documentType: "receipt",
				issueDate: "2026-08-20",
				currencyCode: "PEN",
				hasActiveDeduction: false,
				consumerIdentityEvidence: "matches",
				normalizedResult: {
					deductionCategoryHint: "restaurants_hotels",
					amountPaid: "100.00",
				},
			}),
		).not.toHaveProperty("expenseDate");
	});

	it("does not infer category, year, currency or a second candidate", () => {
		const base = {
			documentStatus: "ready",
			documentType: "receipt",
			issueDate: "2026-08-20",
			currencyCode: "PEN",
			hasActiveDeduction: false,
			consumerIdentityEvidence: "unknown" as const,
			normalizedResult: { amountPaid: "100.00" },
		};
		expect(deriveTaxDeductionCandidate(base)).toBeNull();
		expect(deriveTaxDeductionCandidate({ ...base, issueDate: "2025-08-20" })).toBeNull();
		expect(deriveTaxDeductionCandidate({ ...base, currencyCode: "USD" })).toBeNull();
		expect(deriveTaxDeductionCandidate({ ...base, hasActiveDeduction: true })).toBeNull();
	});
});
