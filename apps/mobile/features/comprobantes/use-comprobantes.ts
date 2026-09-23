import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { z } from "zod";

import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { QUERY_KEYS } from "@/core/query-keys";
import { type Document, DocumentSchema } from "@/features/comprobantes/comprobantes-document";
import type { DocumentUpdatePayload } from "@/features/comprobantes/document-form";

function getBaseUrl(): string {
	const baseURL = process.env.EXPO_PUBLIC_API_URL;
	if (!baseURL) throw new Error("EXPO_PUBLIC_API_URL is not defined");
	return baseURL.replace(/\/$/, "");
}

function nitroFilePath(uri: string): string {
	return uri.startsWith("file://") ? uri.slice("file://".length) : uri;
}

export async function fetchDocumentImageFile(id: string): Promise<string> {
	const cookie = await Promise.resolve(authClient.getCookie());
	const destination = new File(Paths.cache, `document-${id}.jpg`);
	if (destination.exists) destination.delete();
	const task = File.createDownloadTask(`${getBaseUrl()}/documents/${id}/image`, destination, {
		headers: {
			Accept: "image/*",
			...(cookie ? { Cookie: cookie } : {}),
		},
	});
	await task.downloadAsync();
	return nitroFilePath(destination.uri);
}

export async function fetchDocuments(month: string): Promise<Document[]> {
	const data = await apiFetch<unknown>(`/documents?month=${encodeURIComponent(month)}`);
	return z.array(DocumentSchema).parse(data);
}

export function documentImageQueryOptions(id: string) {
	return queryOptions({
		queryKey: QUERY_KEYS.documentImage(id),
		queryFn: () => fetchDocumentImageFile(id),
		staleTime: 5 * 60 * 1000,
	});
}

export function useDocuments(month: string) {
	return useQuery({
		queryKey: QUERY_KEYS.documentsMonth(month),
		queryFn: () => fetchDocuments(month),
		refetchInterval: (query) =>
			query.state.data?.some((d) => d.status === "pending") ? 3000 : false,
	});
}

export function useDocumentImage(id: string, enabled: boolean) {
	return useQuery({
		...documentImageQueryOptions(id),
		enabled,
	});
}

export function invalidateDocumentMetadata(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({
		queryKey: QUERY_KEYS.documents,
		predicate: (query) => query.queryKey[1] !== "image",
	});
	void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.home });
}

export function useUpdateDocument(id: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: DocumentUpdatePayload) =>
			apiFetch(`/documents/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			}),
		onSuccess: () => {
			invalidateDocumentMetadata(queryClient);
		},
	});
}

export function useDeleteDocument(id: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => apiFetch(`/documents/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			queryClient.removeQueries({ queryKey: QUERY_KEYS.documentImage(id), exact: true });
			invalidateDocumentMetadata(queryClient);
		},
	});
}
