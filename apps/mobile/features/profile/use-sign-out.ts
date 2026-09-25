import { authClient } from "@/core/auth-client";
import { clearLocalUserData } from "@/core/clear-local-user-data";
import { queryClient } from "@/core/query-provider";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";

export function useSignOut() {
	async function signOut() {
		const session = await authClient.getSession();
		const userId = session.data?.user?.id;
		try {
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
