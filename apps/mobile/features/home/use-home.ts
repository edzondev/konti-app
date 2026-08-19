import { useQuery } from "@tanstack/react-query";

import { homeQueryOptions } from "./home.queries";

export function useHome(userId: string) {
	return useQuery(homeQueryOptions(userId));
}
