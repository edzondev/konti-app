import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { getDocument, getDocuments } from "./documents.api";

export const documentKeys = {
	all: ["documents"] as const,
	list: (userId: string) => [...documentKeys.all, "list", userId] as const,
	detail: (userId: string, documentId: string) =>
		[...documentKeys.all, "detail", userId, documentId] as const,
};

export const documentsInfiniteQueryOptions = (userId: string) =>
	infiniteQueryOptions({
		queryKey: documentKeys.list(userId),
		queryFn: ({ pageParam }) => getDocuments(pageParam),
		initialPageParam: undefined as string | undefined,
		getNextPageParam: (page) => page.nextCursor ?? undefined,
		enabled: Boolean(userId),
	});

export const documentQueryOptions = (userId: string, documentId: string) =>
	queryOptions({
		queryKey: documentKeys.detail(userId, documentId),
		queryFn: () => getDocument(documentId),
		enabled: Boolean(userId && documentId),
	});
