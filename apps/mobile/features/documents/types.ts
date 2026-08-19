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
