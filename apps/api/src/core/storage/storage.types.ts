export interface ObjectStorage {
	createUploadUrl(input: {
		objectKey: string;
		mimeType: string;
		expiresInSeconds: number;
	}): Promise<{ url: string; headers: Record<string, string>; expiresAt: string }>;
	createDownloadUrl(input: {
		objectKey: string;
		expiresInSeconds: number;
	}): Promise<{ url: string; expiresAt: string }>;
	headObject(objectKey: string): Promise<{ exists: boolean; sizeBytes: number | null }>;
	putObject(input: { objectKey: string; body: Buffer; mimeType: string }): Promise<void>;
}
