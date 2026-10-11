import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { clearLocalUserData } from "@/core/clear-local-user-data";
import { queryClient } from "@/core/query-provider";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";
import { beginAccountDeletion, clearTermsAccepted } from "@/features/auth/terms-acceptance";

export async function deleteAccount() {
	const session = await authClient.getSession();
	const userId = session.data?.user?.id;
	try {
		await apiFetch("/me", { method: "DELETE" });
		beginAccountDeletion();
		clearTermsAccepted();
		await authClient.signOut();
		await queryClient.cancelQueries();
		if (userId) await clearLocalUserData(userId);
		queryClient.clear();
		return true;
	} catch (error) {
		reportError("delete account failed", error);
		showToast("No pudimos eliminar tu cuenta. Intenta de nuevo.");
		return false;
	}
}
