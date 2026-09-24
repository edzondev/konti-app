import { router } from "expo-router";

import { authClient } from "@/core/auth-client";
import { clearLocalUserData } from "@/core/clear-local-user-data";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";

export function useSignOut() {
	async function signOut() {
		const session = await authClient.getSession();
		const userId = session.data?.user?.id;
		try {
			await authClient.signOut();
			if (userId) await clearLocalUserData(userId);
			router.replace("/(auth)/sign-in");
		} catch (error) {
			reportError("sign out failed", error);
			showToast("No se pudo cerrar sesión.");
		}
	}

	return { signOut };
}
