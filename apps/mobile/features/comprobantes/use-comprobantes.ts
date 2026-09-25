import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { z } from "zod";

import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { isDocumentImageKey, QUERY_KEYS } from "@/core/query-keys";
import {
	type Document,
	DocumentSchema,
	loadDocuments,
	readCachedDocuments,
} from "@/features/comprobantes/comprobantes-document";
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

function useUserId(): string | undefined {
	return authClient.useSession().data?.user?.id;
}

export function documentImageQueryOptions(userId: string, id: string) {
	return queryOptions({
		queryKey: QUERY_KEYS.documentImage(userId, id),
		queryFn: () => fetchDocumentImageFile(id),
		staleTime: 5 * 60 * 1000,
	});
}

export function useDocuments(month: string) {
	const userId = useUserId();

	return useQuery({
		queryKey: QUERY_KEYS.documentsMonth(userId ?? "", month),
		queryFn: ({ signal }) => loadDocuments(userId!, month, fetchDocuments, signal),
		enabled: Boolean(userId),
		placeholderData: userId ? readCachedDocuments(userId, month) : undefined,
		refetchInterval: (query) =>
			query.state.data?.some((d) => d.status === "pending" && d.extractionSource !== "manual")
				? 3000
				: false,
	});
}

export function useDocumentImage(id: string, enabled: boolean) {
	const userId = useUserId();

	return useQuery({
		...documentImageQueryOptions(userId ?? "", id),
		enabled: enabled && Boolean(userId),
	});
}

export function invalidateDocumentMetadata(
	queryClient: ReturnType<typeof useQueryClient>,
	userId?: string,
) {
	void queryClient.invalidateQueries({
		queryKey: userId ? QUERY_KEYS.documents(userId) : QUERY_KEYS.documentsRoot,
		predicate: (query) => !isDocumentImageKey(query.queryKey),
	});
	void queryClient.invalidateQueries({
		queryKey: userId ? QUERY_KEYS.home(userId) : QUERY_KEYS.homeRoot,
	});
	void queryClient.invalidateQueries({
		queryKey: userId ? QUERY_KEYS.deductibles(userId) : QUERY_KEYS.deductiblesRoot,
	});
}

export function useUpdateDocument(id: string) {
	const queryClient = useQueryClient();
	const userId = useUserId();

	return useMutation({
		mutationFn: (payload: DocumentUpdatePayload) =>
			apiFetch(`/documents/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			}),
		onSuccess: () => {
			if (userId) invalidateDocumentMetadata(queryClient, userId);
		},
	});
}

export function useDeleteDocument(id: string) {
	const queryClient = useQueryClient();
	const userId = useUserId();

	return useMutation({
		mutationFn: () => apiFetch(`/documents/${id}`, { method: "DELETE" }),
		onSuccess: () => {
			if (!userId) return;
			queryClient.removeQueries({
				queryKey: QUERY_KEYS.documentImage(userId, id),
				exact: true,
			});
			invalidateDocumentMetadata(queryClient, userId);
		},
	});
}
