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
