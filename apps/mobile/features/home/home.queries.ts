import { queryOptions } from "@tanstack/react-query";

import { getHome } from "./home.api";

export const homeKeys = {
	all: ["home"] as const,
	current: (userId: string) => [...homeKeys.all, userId] as const,
};

export const homeQueryOptions = (userId: string) =>
	queryOptions({
		queryKey: homeKeys.current(userId),
		queryFn: getHome,
		enabled: Boolean(userId),
	});
