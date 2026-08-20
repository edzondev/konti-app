import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { getDocument, getDocuments } from "./documents.api";
import type { DocumentListStatus, DocumentsPage } from "./types";

export const documentKeys = {
	all: ["documents"] as const,
	list: (userId: string) => [...documentKeys.all, "list", userId] as const,
	detail: (userId: string, documentId: string) =>
		[...documentKeys.all, "detail", userId, documentId] as const,
};

export function listRefetchIntervalMs(pages: DocumentsPage[] | undefined): number | false {
	if (!pages) {
		return false;
	}

	for (const page of pages) {
		for (const item of page.items) {
			if (item.status === "processing") {
				return 2000;
			}
		}
	}

	return false;
}

export function detailRefetchIntervalMs(status: DocumentListStatus | undefined): number | false {
	return status === "processing" ? 2000 : false;
}

export const documentsInfiniteQueryOptions = (userId: string) =>
	infiniteQueryOptions({
		queryKey: documentKeys.list(userId),
		queryFn: ({ pageParam }) => getDocuments(pageParam),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.nextCursor ?? undefined,
		enabled: Boolean(userId),
		refetchInterval: (query) => listRefetchIntervalMs(query.state.data?.pages),
	});

export const documentQueryOptions = (userId: string, documentId: string) =>
	queryOptions({
		queryKey: documentKeys.detail(userId, documentId),
		queryFn: () => getDocument(documentId),
		enabled: Boolean(userId && documentId),
		refetchInterval: (query) => detailRefetchIntervalMs(query.state.data?.document.status),
	});
