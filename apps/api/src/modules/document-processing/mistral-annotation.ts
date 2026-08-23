import { createDniBlindIndex } from "../../core/security/dni-blind-index";
import type { RawExtraction } from "./extraction";

export class OcrResultInvalidError extends Error {
	readonly code = "OCR_RESULT_INVALID";

	constructor() {
		super("OCR_RESULT_INVALID");
		this.name = "OcrResultInvalidError";
	}
}

function readStringField(source: Record<string, unknown>, key: keyof RawExtraction): string | null {
	const value = source[key];
	if (value === null || value === undefined) {
		return null;
	}
	if (typeof value === "string") {
		return value;
	}
	return null;
}

function toRecord(payload: unknown): Record<string, unknown> {
	if (typeof payload === "string") {
		if (payload.trim().length === 0) {
			throw new OcrResultInvalidError();
		}
		try {
			payload = JSON.parse(payload);
		} catch {
			throw new OcrResultInvalidError();
		}
	}

	if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
		throw new OcrResultInvalidError();
	}

	return payload as Record<string, unknown>;
}

export function parseDocumentAnnotation(payload: unknown): RawExtraction {
	if (payload === null || payload === undefined) {
		throw new OcrResultInvalidError();
	}

	const source = toRecord(payload);

	return {
		issuerTaxId: readStringField(source, "issuerTaxId"),
		issuerName: readStringField(source, "issuerName"),
		issueDate: readStringField(source, "issueDate"),
		documentType: readStringField(source, "documentType"),
		documentNumber: readStringField(source, "documentNumber"),
		currency: readStringField(source, "currency"),
		subtotalAmount: readStringField(source, "subtotalAmount"),
		taxAmount: readStringField(source, "taxAmount"),
		totalAmount: readStringField(source, "totalAmount"),
		paymentTerms: readStringField(source, "paymentTerms"),
		dueDate: readStringField(source, "dueDate"),
		actualPaymentDate: readStringField(source, "actualPaymentDate"),
		grossFeeAmount: readStringField(source, "grossFeeAmount"),
		incomeTaxWithheldAmount: readStringField(source, "incomeTaxWithheldAmount"),
		netPaidAmount: readStringField(source, "netPaidAmount"),
		payerName: readStringField(source, "payerName"),
		employmentRecordKind: readStringField(source, "employmentRecordKind"),
		employmentGrossAmount: readStringField(source, "employmentGrossAmount"),
		employmentWithheldTaxAmount: readStringField(source, "employmentWithheldTaxAmount"),
		coverageStart: readStringField(source, "coverageStart"),
		coverageEnd: readStringField(source, "coverageEnd"),
		coverageScope: readStringField(source, "coverageScope"),
		employerName: readStringField(source, "employerName"),
		employerTaxId: readStringField(source, "employerTaxId"),
		deductionCategoryHint: readStringField(source, "deductionCategoryHint"),
		serviceDescription: readStringField(source, "serviceDescription"),
		amountPaid: readStringField(source, "amountPaid"),
		insuranceReimbursementAmount: readStringField(source, "insuranceReimbursementAmount"),
		paymentMethodEvidence: readStringField(source, "paymentMethodEvidence"),
		propertyCountry: readStringField(source, "propertyCountry"),
		propertyUse: readStringField(source, "propertyUse"),
		supportingFormNumber: readStringField(source, "supportingFormNumber"),
		workerRegistrationEvidence: readStringField(source, "workerRegistrationEvidence"),
		attributionHint: readStringField(source, "attributionHint"),
		consumerDocumentNumber: readStringField(source, "consumerDocumentNumber"),
	};
}

export function protectConsumerDocument(
	fields: RawExtraction,
	annotation: unknown,
	secret: string | null,
): { fields: RawExtraction; sanitizedAnnotation: Record<string, unknown> } {
	const { consumerDocumentNumber, ...safeFields } = fields;
	const digits = consumerDocumentNumber?.replace(/\D/g, "") ?? "";
	let consumerDocumentBlindIndex: string | null = null;
	let consumerDocumentLast4: string | null = null;
	if (secret && /^\d{8}$/.test(digits)) {
		const identity = createDniBlindIndex(digits, secret);
		consumerDocumentBlindIndex = identity.blindIndex;
		consumerDocumentLast4 = identity.last4;
	}
	const source = toRecord(annotation);
	return {
		fields: {
			...safeFields,
			consumerDocumentBlindIndex,
			consumerDocumentLast4,
		},
		sanitizedAnnotation: redactConsumerDocumentFromValue(
			{ ...source, consumerDocumentNumber: null },
			consumerDocumentNumber ?? null,
		) as Record<string, unknown>,
	};
}

export function redactConsumerDocumentFromValue(
	value: unknown,
	consumerDocument: string | null,
): unknown {
	if (!consumerDocument) return value;
	const digits = consumerDocument.replace(/\D/g, "");
	if (!/^\d{8}$/.test(digits)) return value;
	const redact = (text: string) =>
		text.replaceAll(consumerDocument, "[DNI_REDACTED]").replaceAll(digits, "[DNI_REDACTED]");
	if (typeof value === "string") return redact(value);
	if (Array.isArray(value)) {
		return value.map((item) => redactConsumerDocumentFromValue(item, consumerDocument));
	}
	if (typeof value === "object" && value !== null) {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [
				key,
				redactConsumerDocumentFromValue(item, consumerDocument),
			]),
		);
	}
	return value;
}
