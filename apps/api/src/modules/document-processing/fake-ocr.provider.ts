import type { OcrExtractInput, OcrExtractResult, OcrProvider } from "./ocr.types";

export class FakeOcrProvider implements OcrProvider {
	readonly provider = "fake";

	async extract(_input: OcrExtractInput): Promise<OcrExtractResult> {
		return {
			fields: {
				issuerTaxId: "20100070970",
				issuerName: null,
				issueDate: "2026-08-12",
				documentType: "boleta",
				documentNumber: null,
				currency: null,
				subtotalAmount: null,
				taxAmount: null,
				totalAmount: "148.00",
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
			},
			pageConfidence: null,
			fieldConfidence: {
				issuerTaxId: null,
				issueDate: null,
				totalAmount: null,
				documentType: null,
			},
			rawPayload: {},
			provider: "fake",
			providerVersion: "1",
		};
	}
}
