import { usePostHog } from "posthog-react-native";
import { useRef } from "react";

import { authClient } from "@/core/auth-client";
import { clearLocalUserData } from "@/core/clear-local-user-data";
import { trackFeature } from "@/core/funnel-events";
import { queryClient } from "@/core/query-provider";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";

export function useSignOut() {
	const posthog = usePostHog();
	const posthogRef = useRef(posthog);
	posthogRef.current = posthog;

	async function signOut() {
		const session = await authClient.getSession();
		const userId = session.data?.user?.id;
		try {
			trackFeature(posthogRef.current, "sign_out");
			await authClient.signOut();
			await queryClient.cancelQueries();
			if (userId) await clearLocalUserData(userId);
			queryClient.clear();
		} catch (error) {
			reportError("sign out failed", error);
			showToast("No se pudo cerrar sesión.");
		}
	}

	return { signOut };
}
