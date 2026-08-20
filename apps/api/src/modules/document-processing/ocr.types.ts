import type { RawExtraction } from "./extraction";

export type OcrExtractInput = {
	documentId: string;
	objectKey: string;
	mimeType: "image/jpeg" | "image/png";
	imageUrl: string;
};

export type OcrExtractResult = {
	fields: RawExtraction;
	pageConfidence: number | null;
	fieldConfidence: {
		issuerTaxId: null;
		issueDate: null;
		totalAmount: null;
		documentType: null;
	};
	rawPayload: Record<string, unknown>;
	provider: string;
	providerVersion: string;
};

export interface OcrProvider {
	readonly provider: string;
	extract(input: OcrExtractInput): Promise<OcrExtractResult>;
}
