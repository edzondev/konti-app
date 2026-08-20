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
	};
}
