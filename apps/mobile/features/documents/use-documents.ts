import { useInfiniteQuery } from "@tanstack/react-query";

import { documentsInfiniteQueryOptions } from "./documents.queries";

export function useDocuments(userId: string) {
	return useInfiniteQuery(documentsInfiniteQueryOptions(userId));
}
