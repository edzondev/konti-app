import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/core/api-fetch";
import { QUERY_KEYS } from "@/core/query-keys";
import { type DocumentListItem, DocumentListSchema } from "./document";
import { currentLimaMonth, readDocumentsCache, writeDocumentsCache } from "./documents-cache";

export async function fetchDocuments(month: string): Promise<DocumentListItem[]> {
	const raw = await apiFetch<unknown>(`/documents?month=${encodeURIComponent(month)}`);
	const docs = DocumentListSchema.parse(raw);
	writeDocumentsCache(month, docs);
	return docs;
}

export function useDocuments(month = currentLimaMonth()) {
	const cached = readDocumentsCache(month);

	return useQuery({
		queryKey: QUERY_KEYS.documentsMonth(month),
		initialData: cached,
		initialDataUpdatedAt: cached ? Date.now() : undefined,
		queryFn: () => fetchDocuments(month),
	});
}
