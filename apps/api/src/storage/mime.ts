import * as v from "valibot";

export const DOCUMENT_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"application/pdf",
] as const;

export const DocumentMimeTypeSchema = v.picklist(DOCUMENT_MIME_TYPES);

export type DocumentMimeType = v.InferOutput<typeof DocumentMimeTypeSchema>;
