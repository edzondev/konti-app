import { useQuery } from "@tanstack/react-query";

import { documentQueryOptions } from "./documents.queries";

export function useDocument(userId: string, documentId: string) {
	return useQuery(documentQueryOptions(userId, documentId));
}
