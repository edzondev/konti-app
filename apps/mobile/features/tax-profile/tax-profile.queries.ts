import { queryOptions } from "@tanstack/react-query";

import { getCurrentTaxProfile } from "./tax-profile.api";

export const taxProfileKeys = {
	all: ["tax-profile"] as const,
	current: (userId: string) => [...taxProfileKeys.all, "current", userId] as const,
};

export const currentTaxProfileQuery = (userId: string) =>
	queryOptions({
		queryKey: taxProfileKeys.current(userId),
		queryFn: getCurrentTaxProfile,
		enabled: !!userId,
	});
