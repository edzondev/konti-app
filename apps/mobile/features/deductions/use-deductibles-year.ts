import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/core/auth-client";
import { QUERY_KEYS } from "@/core/query-keys";

import { currentLimaYear, fetchDeductiblesYear } from "./deductibles-year";

export function useDeductiblesYear(year = currentLimaYear()) {
	const userId = authClient.useSession().data?.user?.id;

	return useQuery({
		queryKey: QUERY_KEYS.deductiblesYear(userId ?? "", year),
		queryFn: () => fetchDeductiblesYear(year),
		enabled: Boolean(userId),
	});
}
