import type { Document } from "@/features/comprobantes/comprobantes-document";

/** Which row the open sheet should show. The sheet follows the selection, not month membership. */
export function resolveOpenDocument(
	documentId: string | null,
	held: Document | null,
	monthDocuments: Document[] | undefined,
	listUpdatedAt: number,
	savedAt: number,
): Document | null {
	if (documentId == null) return null;
	const fresh = monthDocuments?.find((doc) => doc.id === documentId) ?? null;
	const pinned = held?.id === documentId ? held : null;
	if (listUpdatedAt > savedAt) return fresh ?? pinned;
	return pinned ?? fresh;
}
