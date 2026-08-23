export type DocumentImagePriority = "low" | "high";

export function remoteDocumentImageSource(
	url: string,
	documentId: string,
	priority: DocumentImagePriority,
) {
	return {
		url,
		options: {
			priority,
			cacheKey: `document:${documentId}`,
			scaleDownLargeImages: true,
		},
	} as const;
}
