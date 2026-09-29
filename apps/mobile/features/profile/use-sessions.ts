import { useQuery } from "@tanstack/react-query";

import { parse } from "valibot";
import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { QUERY_KEYS } from "@/core/query-keys";
import { type MeSession, MeSessionsResponseSchema } from "@/features/profile/profile-schemas";

export type { MeSession };

export async function fetchSessions(): Promise<MeSession[]> {
	const raw = await apiFetch<unknown>("/me/sessions");
	return parse(MeSessionsResponseSchema, raw);
}

export function useSessions() {
	const userId = authClient.useSession().data?.user?.id;

	return useQuery({
		queryKey: QUERY_KEYS.sessions(userId ?? ""),
		queryFn: fetchSessions,
		enabled: Boolean(userId),
	});
}
