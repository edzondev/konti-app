import { useCallback, useSyncExternalStore } from "react";
import { router } from "expo-router";

import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { clearLocalUserData } from "@/core/clear-local-user-data";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";

let presented = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot() {
	return presented;
}

function setPresented(next: boolean) {
	if (presented === next) return;
	presented = next;
	for (const listener of listeners) listener();
}

export function useDeleteAccount() {
	const openDeleteSheet = useCallback(() => {
		setPresented(true);
	}, []);

	return { openDeleteSheet };
}

export function useDeleteAccountSheetState() {
	const isPresented = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	const dismiss = useCallback(() => {
		setPresented(false);
	}, []);

	const confirmDelete = useCallback(async () => {
		const session = await authClient.getSession();
		const userId = session.data?.user?.id;
		try {
			await apiFetch("/me", { method: "DELETE" });
			if (userId) await clearLocalUserData(userId);
			await authClient.signOut();
			setPresented(false);
			router.replace("/(auth)/sign-in");
		} catch (error) {
			reportError("delete account failed", error);
			showToast("No pudimos eliminar tu cuenta. Intenta de nuevo.");
		}
	}, []);

	return { isPresented, dismiss, confirmDelete };
}
