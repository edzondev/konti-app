import { QUERY_KEYS } from "@/core/query-keys";
import { queryClient } from "@/core/query-provider";
import { clearDocumentsCache } from "./documents-cache";

/** Call from the sign-out handler. Not from a session-watching effect. */
export function clearLocalDocuments(): void {
	clearDocumentsCache();
	queryClient.removeQueries({ queryKey: QUERY_KEYS.documents });
}
