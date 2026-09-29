export const DOCUMENT_TYPES = [
	"boleta",
	"factura",
	"recibo_honorarios",
	"ticket",
	"unknown",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export function emptyExtraction(): ExtractedDocument {
	return {
		documentType: "unknown",
		issuerName: null,
		issuerTaxId: null,
		issueDate: null,
		documentNumber: null,
		currencyCode: null,
		totalAmount: null,
		igvAmount: null,
	};
}

export interface ExtractedDocument {
	documentType: DocumentType;
	issuerName: string | null;
	issuerTaxId: string | null;
	issueDate: string | null; // YYYY-MM-DD
	documentNumber: string | null;
	currencyCode: string | null;
	totalAmount: string | null; // numeric string
	igvAmount: string | null; // numeric string
}
