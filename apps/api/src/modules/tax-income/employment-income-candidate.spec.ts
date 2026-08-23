import {
	deriveEmploymentIncomeCandidate,
	type EmploymentIncomeCandidateSource,
} from "./employment-income-candidate";

const source: EmploymentIncomeCandidateSource = {
	documentType: "payroll_slip",
	status: "ready",
	currencyCode: "PEN",
	hasActiveIncome: false,
	normalizedResult: {
		employmentRecordKind: "period",
		employmentGrossAmount: "5000.00",
		employmentWithheldTaxAmount: "150.00",
		coverageStart: "2026-03-01",
		coverageEnd: "2026-03-31",
		coverageScope: "single_payer",
		employerName: "ACME SAC",
		employerTaxId: "20123456789",
	},
};

describe("deriveEmploymentIncomeCandidate", () => {
	it("returns editable OCR evidence without claiming SUNAT verification", () => {
		expect(deriveEmploymentIncomeCandidate(source)).toEqual({
			eligibility: "eligible",
			recordKind: "period",
			coverageStart: "2026-03-01",
			coverageEnd: "2026-03-31",
			coverageScope: "single_payer",
			grossAmount: "5000.00",
			withheldTaxAmount: "150.00",
			payerName: "ACME SAC",
			payerTaxId: "20123456789",
			verificationScope: "unverified_ocr_evidence",
			warnings: [],
		});
	});

	it("requires a ready document and valid canonical employment fields", () => {
		const candidate = deriveEmploymentIncomeCandidate(
			{
				...source,
				status: "processing",
				normalizedResult: {
					...source.normalizedResult,
					coverageStart: "2026-03-40",
					employmentGrossAmount: "five thousand",
					employerTaxId: "123",
				},
			},
			new Date("2026-08-23T12:00:00.000Z"),
		);

		expect(candidate).toMatchObject({
			eligibility: "insufficient_fields",
			warnings: expect.arrayContaining([
				"document_not_ready",
				"invalid_coverage_start",
				"invalid_gross_amount",
				"invalid_payer_tax_id",
			]),
		});
	});

	it("rejects all-employer scope for a non-accumulated period", () => {
		const candidate = deriveEmploymentIncomeCandidate({
			...source,
			normalizedResult: { ...source.normalizedResult, coverageScope: "all_employers" },
		});

		expect(candidate).toMatchObject({
			eligibility: "insufficient_fields",
			warnings: expect.arrayContaining(["invalid_coverage_combination"]),
		});
	});

	it("keeps missing coverage fields explicit instead of inferring a month", () => {
		const candidate = deriveEmploymentIncomeCandidate({
			...source,
			normalizedResult: { ...source.normalizedResult, coverageStart: null },
		});

		expect(candidate).toMatchObject({
			eligibility: "insufficient_fields",
			coverageStart: null,
			warnings: ["missing_coverage_start"],
		});
	});

	it("does not offer canonical inclusion for unsupported currency or an already used document", () => {
		expect(deriveEmploymentIncomeCandidate({ ...source, currencyCode: "USD" })).toMatchObject({
			eligibility: "unsupported_currency",
		});
		expect(deriveEmploymentIncomeCandidate({ ...source, hasActiveIncome: true })).toMatchObject({
			eligibility: "already_decided",
		});
	});
});
