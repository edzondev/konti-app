import {
	OcrResultInvalidError,
	parseDocumentAnnotation,
	protectConsumerDocument,
} from "./mistral-annotation";

describe("parseDocumentAnnotation", () => {
	it("parses a JSON string annotation", () => {
		expect(parseDocumentAnnotation('{"issuerTaxId":"20100070970"}').issuerTaxId).toBe(
			"20100070970",
		);
	});

	it("parses an object annotation", () => {
		expect(parseDocumentAnnotation({ issuerTaxId: "20100070970" }).issuerTaxId).toBe("20100070970");
	});

	it("parses semantic fee-receipt fields from the same annotation", () => {
		expect(
			parseDocumentAnnotation({
				paymentTerms: "credit",
				dueDate: "2026-08-20",
				actualPaymentDate: null,
				grossFeeAmount: "2500.00",
				incomeTaxWithheldAmount: "200.00",
				netPaidAmount: "2300.00",
				payerName: "Cliente SAC",
			}),
		).toMatchObject({
			paymentTerms: "credit",
			dueDate: "2026-08-20",
			actualPaymentDate: null,
			grossFeeAmount: "2500.00",
			incomeTaxWithheldAmount: "200.00",
			netPaidAmount: "2300.00",
			payerName: "Cliente SAC",
		});
	});

	it("parses employment evidence from the same annotation", () => {
		expect(
			parseDocumentAnnotation({
				employmentRecordKind: "year_to_date_snapshot",
				employmentGrossAmount: "30000.00",
				employmentWithheldTaxAmount: "1000.00",
				coverageStart: "2026-01-01",
				coverageEnd: "2026-06-30",
				coverageScope: "all_employers",
				employerName: null,
				employerTaxId: null,
			}),
		).toMatchObject({
			employmentRecordKind: "year_to_date_snapshot",
			coverageScope: "all_employers",
			employmentGrossAmount: "30000.00",
		});
	});

	it("turns a transient consumer DNI into a blind index and redacts every persisted payload", () => {
		const annotation = JSON.stringify({
			issuerTaxId: "20100070970",
			consumerDocumentNumber: "12345678",
			serviceDescription: "Atención para DNI 12345678",
		});
		const protectedResult = protectConsumerDocument(
			parseDocumentAnnotation(annotation),
			annotation,
			"a-secret-key-for-tests-with-32-bytes",
		);

		expect(protectedResult.fields).toMatchObject({
			consumerDocumentBlindIndex: expect.stringMatching(/^[a-f0-9]{64}$/),
			consumerDocumentLast4: "5678",
		});
		expect(protectedResult.fields).not.toHaveProperty("consumerDocumentNumber");
		expect(JSON.stringify(protectedResult.sanitizedAnnotation)).not.toContain("12345678");
	});

	it("returns null for missing fields", () => {
		expect(parseDocumentAnnotation("{}")).toEqual({
			issuerTaxId: null,
			issuerName: null,
			issueDate: null,
			documentType: null,
			documentNumber: null,
			currency: null,
			subtotalAmount: null,
			taxAmount: null,
			totalAmount: null,
			paymentTerms: null,
			dueDate: null,
			actualPaymentDate: null,
			grossFeeAmount: null,
			incomeTaxWithheldAmount: null,
			netPaidAmount: null,
			payerName: null,
			employmentRecordKind: null,
			employmentGrossAmount: null,
			employmentWithheldTaxAmount: null,
			coverageStart: null,
			coverageEnd: null,
			coverageScope: null,
			employerName: null,
			employerTaxId: null,
			deductionCategoryHint: null,
			serviceDescription: null,
			amountPaid: null,
			insuranceReimbursementAmount: null,
			paymentMethodEvidence: null,
			propertyCountry: null,
			propertyUse: null,
			supportingFormNumber: null,
			workerRegistrationEvidence: null,
			attributionHint: null,
			consumerDocumentNumber: null,
		});
	});

	it("throws OCR_RESULT_INVALID for invalid JSON", () => {
		expect(() => parseDocumentAnnotation("not-json")).toThrow(OcrResultInvalidError);
		expect(() => parseDocumentAnnotation("not-json")).toThrow("OCR_RESULT_INVALID");
	});

	it("throws OCR_RESULT_INVALID for empty annotation", () => {
		expect(() => parseDocumentAnnotation("")).toThrow("OCR_RESULT_INVALID");
		expect(() => parseDocumentAnnotation(null)).toThrow("OCR_RESULT_INVALID");
	});
});
