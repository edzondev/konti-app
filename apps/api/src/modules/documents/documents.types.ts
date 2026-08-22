import type {
	DocumentStatus,
	DocumentType,
	ProcessingStatus,
} from "../../database/schema/schema.types";
import type { FourthIncomeCandidate } from "../tax-income/tax-income-candidate";

export type DocumentUploadStatus = Extract<DocumentStatus, "pending_upload" | "uploaded">;

export type DoubtfulField = "issuerTaxId" | "issueDate" | "totalAmount" | "documentType";

export type DocumentRecord = {
	id: string;
	taxProfileId: string;
	status: DocumentStatus;
	idempotencyKey: string;
	objectKey: string;
	originalFileName: string | null;
	mimeType: "image/jpeg" | "image/png";
	sizeBytes: number;
	sha256: string;
	pageCount: number;
	source: "camera" | "gallery";
	documentType: DocumentType;
	issuerName: string | null;
	issuerTaxId: string | null;
	documentNumber: string | null;
	totalAmount: string | null;
	subtotalAmount: string | null;
	taxAmount: string | null;
	currencyCode: string | null;
	issueDate: string | null;
	metadata: Record<string, unknown>;
	deletedAt: Date | null;
	createdAt: Date;
};

export type DocumentListItem = {
	id: string;
	status: DocumentStatus;
	source: "camera" | "gallery";
	createdAt: string;
	originalFileName: string | null;
	mimeType: string;
	previewUrl: string;
	previewExpiresAt: string;
	issuerName: string | null;
	issuerTaxId: string | null;
	documentNumber: string | null;
	totalAmount: string | null;
	subtotalAmount: string | null;
	taxAmount: string | null;
	currencyCode: string | null;
	documentType: string;
	issueDate: string | null;
	doubtfulFields: DoubtfulField[];
};

export type DocumentProcessingView = {
	status: ProcessingStatus;
	attemptNumber: number;
	doubtfulFields: DoubtfulField[];
};

export type DocumentDetail = {
	document: Omit<DocumentListItem, "previewUrl" | "previewExpiresAt">;
	processing: DocumentProcessingView | null;
	attention: null;
	taxIncomeCandidate: FourthIncomeCandidate | null;
};

export interface DocumentsRepositoryPort {
	findByIdempotencyKey(taxProfileId: string, key: string): Promise<DocumentRecord | undefined>;
	findVisibleBySha256(taxProfileId: string, sha256: string): Promise<DocumentRecord | undefined>;
	insertPending(row: DocumentRecord): Promise<DocumentRecord>;
	updateStatus(
		id: string,
		fromStatus: DocumentUploadStatus,
		toStatus: DocumentUploadStatus,
	): Promise<boolean>;
	getOwned(taxProfileId: string, documentId: string): Promise<DocumentRecord | undefined>;
	listVisible(
		taxProfileId: string,
		query: { cursor?: { createdAt: Date; id: string }; limit: number },
	): Promise<DocumentRecord[]>;
	countVisible(taxProfileId: string): Promise<number>;
}

export type CreateUploadResult =
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
