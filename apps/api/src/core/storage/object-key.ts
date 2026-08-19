export function buildDocumentObjectKey(input: {
	userId: string;
	taxYear: number;
	documentId: string;
	mimeType: "image/jpeg" | "image/png";
}): string {
	const extension = input.mimeType === "image/jpeg" ? "jpg" : "png";

	return `users/${input.userId}/tax/${input.taxYear}/documents/${input.documentId}/original.${extension}`;
}
