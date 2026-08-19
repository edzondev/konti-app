export type DocumentUploadStatus = "pending_upload" | "uploaded";

export type DocumentRecord = {
	id: string;
	taxProfileId: string;
	status: DocumentUploadStatus;
	idempotencyKey: string;
	objectKey: string;
	originalFileName: string;
	mimeType: "image/jpeg" | "image/png";
	sizeBytes: number;
	sha256: string;
	pageCount: number;
	source: "camera" | "gallery";
	deletedAt: Date | null;
	createdAt: Date;
};

export type DocumentListItem = {
	id: string;
	status: "uploaded";
	source: "camera" | "gallery";
	createdAt: string;
	originalFileName: string | null;
	mimeType: string;
	previewUrl: string;
	previewExpiresAt: string;
};

export type DocumentDetail = {
	document: Omit<DocumentListItem, "previewUrl" | "previewExpiresAt">;
	processing: null;
	attention: null;
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
	countUploaded(taxProfileId: string): Promise<number>;
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
