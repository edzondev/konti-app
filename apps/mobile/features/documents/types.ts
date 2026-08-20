export type DocumentListStatus = "uploaded" | "processing" | "ready" | "needs_review" | "failed";

export type DocumentType =
	| "unknown"
	| "receipt"
	| "invoice"
	| "fee_receipt"
	| "payroll_slip"
	| "withholding_certificate"
	| "sunat_document"
	| "other";

export type DoubtfulField = "issuerTaxId" | "issueDate" | "totalAmount" | "documentType";

export type ListSubtitleTone = "muted" | "gold" | "primary";

export type DocumentListItem = {
	id: string;
	status: DocumentListStatus;
	source: "camera" | "gallery";
	createdAt: string;
	originalFileName: string | null;
	mimeType: string;
	previewUrl: string;
	previewExpiresAt: string;
	issuerName?: string | null;
	issuerTaxId?: string | null;
	totalAmount?: string | null;
	currencyCode?: "PEN" | "USD" | null;
	documentType?: DocumentType | null;
	issueDate?: string | null;
	documentNumber?: string | null;
	subtotalAmount?: string | null;
	taxAmount?: string | null;
	doubtfulFields?: DoubtfulField[];
};

export type DocumentDetail = {
	document: Omit<DocumentListItem, "previewUrl" | "previewExpiresAt">;
	processing: {
		status: "queued" | "processing" | "succeeded" | "failed";
		attemptNumber: number;
		doubtfulFields: DoubtfulField[];
	} | null;
	attention: null;
};

export type DocumentsPage = {
	items: DocumentListItem[];
	nextCursor: string | null;
};

export type CreateDocumentUploadInput = {
	source: "camera" | "gallery";
	originalFileName: string;
	mimeType: "image/jpeg" | "image/png";
	sizeBytes: number;
	sha256: string;
	pageCount: 1;
	idempotencyKey: string;
};

export type CreateDocumentUploadResult =
	| {
			duplicate: false;
			document: { id: string; status: "pending_upload" };
			upload: {
				url: string;
				method: "PUT";
				headers: Record<string, string>;
				expiresAt: string;
			};
	  }
	| {
			duplicate: true;
			document: { id: string; status: string };
	  };
