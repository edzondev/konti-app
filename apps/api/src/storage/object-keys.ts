import { randomUUID } from "node:crypto";
import type { DocumentMimeType } from "./mime.js";

// Mapa exhaustivo: si agregas un MIME en mime.ts, TypeScript exige su extensión acá.
const EXTENSION: Record<DocumentMimeType, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
	"application/pdf": "pdf",
};

export function buildDocumentObjectKey(userId: string, mimeType: DocumentMimeType): string {
	return `users/${userId}/documents/${randomUUID()}.${EXTENSION[mimeType]}`;
}
