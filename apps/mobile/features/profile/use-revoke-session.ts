import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { QUERY_KEYS } from "@/core/query-keys";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";

export function useRevokeSession() {
	const queryClient = useQueryClient();
	const userId = authClient.useSession().data?.user?.id;

	return useMutation({
		mutationFn: (sessionId: string) =>
			apiFetch(`/me/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),
		onSuccess: () => {
			showToast("Sesión revocada");
			if (!userId) return;
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions(userId) });
		},
		onError: (error) => {
			reportError("revoke session failed", error);
			showToast("No se pudo revocar la sesión.");
		},
	});
}
