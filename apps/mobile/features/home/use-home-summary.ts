import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { QUERY_KEYS } from "@/core/query-keys";

import {
	currentLimaMonth,
	type HomeSummary,
	HomeSummarySchema,
	loadHomeSummary,
	readCachedHomeSummary,
} from "./home-summary";

export async function fetchHomeSummary(month: string): Promise<HomeSummary> {
	const raw = await apiFetch<unknown>(`/documents/summary?month=${encodeURIComponent(month)}`);
	return HomeSummarySchema.parse(raw);
}

export function useHomeSummary(month = currentLimaMonth()) {
	const userId = authClient.useSession().data?.user?.id;

	return useQuery({
		queryKey: QUERY_KEYS.homeSummary(userId ?? "", month),
		queryFn: ({ signal }) => loadHomeSummary(userId!, month, fetchHomeSummary, signal),
		enabled: Boolean(userId),
		placeholderData: userId ? readCachedHomeSummary(userId, month) : undefined,
		refetchInterval: (query) => ((query.state.data?.processingCount ?? 0) > 0 ? 3000 : false),
	});
}
