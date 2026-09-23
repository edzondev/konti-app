import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/core/query-keys";

import { currentLimaYear, fetchDeductiblesYear } from "./deductibles-year";

export function useDeductiblesYear(year = currentLimaYear()) {
	return useQuery({
		queryKey: QUERY_KEYS.deductiblesYear(year),
		queryFn: () => fetchDeductiblesYear(year),
	});
}
