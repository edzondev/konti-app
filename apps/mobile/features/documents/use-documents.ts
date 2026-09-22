import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";
import { apiFetch } from "@/core/api-fetch";
import { QUERY_KEYS } from "@/core/query-keys";
import { queryClient } from "@/core/query-provider";
import {
	type DocumentImage,
	DocumentImageSchema,
	type DocumentListItem,
	DocumentListItemSchema,
	DocumentListSchema,
	readDocumentsCache,
	type UpdateDocumentInput,
	writeDocumentsCache,
} from "./document";
import { currentLimaMonth } from "./document-ui";

export { clearLocalDocuments, readDocumentsCache, writeDocumentsCache } from "./document";

export async function fetchDocuments(month: string): Promise<DocumentListItem[]> {
	const raw = await apiFetch<unknown>(`/documents?month=${encodeURIComponent(month)}`);
	const docs = DocumentListSchema.parse(raw);
	writeDocumentsCache(month, docs);
	return docs;
}

export async function fetchDocument(id: string): Promise<DocumentListItem> {
	const raw = await apiFetch<unknown>(`/documents/${id}`);
	return DocumentListItemSchema.parse(raw);
}

export async function fetchDocumentImage(id: string): Promise<DocumentImage> {
	const raw = await apiFetch<unknown>(`/documents/${id}/image`);
	return DocumentImageSchema.parse(raw);
}

export function peekDocument(id: string): DocumentListItem | undefined {
	for (const [, data] of queryClient.getQueriesData({ queryKey: QUERY_KEYS.documents })) {
		if (Array.isArray(data)) {
			const found = data.find((doc: DocumentListItem) => doc.id === id);
			if (found) return found;
		} else if (data && typeof data === "object" && "id" in data && data.id === id) {
			return data as DocumentListItem;
		}
	}
	return undefined;
}

export function useDocuments(month = currentLimaMonth()) {
	const cached = readDocumentsCache(month);
	return useQuery({
		queryKey: QUERY_KEYS.documentsMonth(month),
		initialData: cached,
		initialDataUpdatedAt: cached ? Date.now() : undefined,
		queryFn: () => fetchDocuments(month),
		refetchInterval: (query) =>
			query.state.data?.some((doc) => doc.status === "pending") ? 3000 : false,
	});
}

export function useDocument(id: string | undefined) {
	const cached = id ? peekDocument(id) : undefined;
	return useQuery({
		queryKey: QUERY_KEYS.document(id ?? ""),
		queryFn: () => fetchDocument(id as string),
		enabled: Boolean(id),
		initialData: cached,
		refetchInterval: (query) => (query.state.data?.status === "pending" ? 3000 : false),
	});
}

export function useDocumentImage(id: string, enabled: boolean) {
	return useQuery({
		queryKey: QUERY_KEYS.documentImage(id),
		queryFn: () => fetchDocumentImage(id),
		enabled,
		staleTime: 60_000,
	});
}

export function useDeleteDocument() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => apiFetch(`/documents/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			void client.invalidateQueries({ queryKey: QUERY_KEYS.documents });
		},
	});
}

export function useUpdateDocument() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ id, patch }: { id: string; patch: UpdateDocumentInput }) =>
			apiFetch<unknown>(`/documents/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(patch),
			}).then((raw) => DocumentListItemSchema.parse(raw)),
		onSuccess: (doc) => {
			client.setQueryData(QUERY_KEYS.document(doc.id), doc);
			void client.invalidateQueries({ queryKey: QUERY_KEYS.documents });
		},
	});
}

export type CreateDocumentInput = {
	source: "camera" | "gallery" | "share";
	uri: string;
	mimeType?: string;
	qrPayload?: string;
};

function toFileUri(uri: string): string {
	if (uri.startsWith("file://")) return uri;
	if (uri.startsWith("/") || /^[A-Za-z]:[\\/]/.test(uri)) return `file://${uri}`;
	return uri;
}

export async function createDocument(input: CreateDocumentInput): Promise<DocumentListItem> {
	const body = new FormData();
	body.append("file", new File(toFileUri(input.uri)));
	body.append("source", input.source);
	if (input.qrPayload) body.append("qrPayload", input.qrPayload);
	const raw = await apiFetch<unknown>("/documents", { method: "POST", body });
	return DocumentListItemSchema.parse(raw);
}

export function useCreateDocument() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: createDocument,
		onSuccess: () => {
			void client.invalidateQueries({ queryKey: QUERY_KEYS.documents });
		},
	});
}
