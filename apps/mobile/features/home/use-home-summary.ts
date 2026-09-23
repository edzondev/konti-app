import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/core/api-fetch";
import { QUERY_KEYS } from "@/core/query-keys";

import { currentLimaMonth, type HomeSummary, HomeSummarySchema } from "./home-summary";

export async function fetchHomeSummary(month: string): Promise<HomeSummary> {
	const raw = await apiFetch<unknown>(`/documents/summary?month=${encodeURIComponent(month)}`);
	return HomeSummarySchema.parse(raw);
}

export function useHomeSummary(month = currentLimaMonth()) {
	return useQuery({
		queryKey: QUERY_KEYS.homeSummary(month),
		queryFn: () => fetchHomeSummary(month),
	});
}
