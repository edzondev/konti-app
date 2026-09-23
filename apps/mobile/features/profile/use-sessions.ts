import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/core/api-fetch";
import { QUERY_KEYS } from "@/core/query-keys";
import {
	MeSessionsResponseSchema,
	type MeSession,
} from "@/features/profile/profile-schemas";

export type { MeSession };

export async function fetchSessions(): Promise<MeSession[]> {
	const raw = await apiFetch<unknown>("/me/sessions");
	return MeSessionsResponseSchema.parse(raw);
}

export function useSessions() {
	return useQuery({
		queryKey: QUERY_KEYS.sessions,
		queryFn: fetchSessions,
	});
}
