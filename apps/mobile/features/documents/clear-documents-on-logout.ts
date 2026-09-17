import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { authClient } from "@/core/auth-client";
import { QUERY_KEYS } from "@/core/query-keys";
import { clearDocumentsCache } from "./documents-cache";

export function ClearDocumentsOnLogout() {
	const queryClient = useQueryClient();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (isPending) return;
		if (session) return;

		clearDocumentsCache();
		queryClient.removeQueries({ queryKey: QUERY_KEYS.documents });
	}, [session, isPending, queryClient]);

	return null;
}
