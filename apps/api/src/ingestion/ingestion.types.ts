export type DocumentType = "boleta" | "factura" | "recibo_honorarios" | "ticket" | "unknown";

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
