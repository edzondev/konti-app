import { useCallback, useState, useSyncExternalStore } from "react";
import { useWindowDimensions } from "react-native";
import { useResolveClassNames } from "uniwind";

import { apiFetch } from "@/core/api-fetch";
import { authClient } from "@/core/auth-client";
import { clearLocalUserData } from "@/core/clear-local-user-data";
import { queryClient } from "@/core/query-provider";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";
import { beginAccountDeletion, clearTermsAccepted } from "@/features/auth/terms-acceptance";

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
			beginAccountDeletion();
			clearTermsAccepted();
			await authClient.signOut();
			await queryClient.cancelQueries();
			if (userId) await clearLocalUserData(userId);
			queryClient.clear();
			setPresented(false);
		} catch (error) {
			reportError("delete account failed", error);
			showToast("No pudimos eliminar tu cuenta. Intenta de nuevo.");
		}
	}, []);

	return { isPresented, dismiss, confirmDelete };
}

const CONFIRM_WORD = "ELIMINAR";

export function useDeleteAccountSheet() {
	const { isPresented, dismiss, confirmDelete } = useDeleteAccountSheetState();
	const [text, setText] = useState("");
	const [busy, setBusy] = useState(false);
	const { height, width } = useWindowDimensions();
	const sheetBackground = useResolveClassNames("bg-konti-bg");
	const placeholder = useResolveClassNames("text-konti-ink-faint");
	const canConfirm = text === CONFIRM_WORD && !busy;

	function onDismiss() {
		if (busy) return;
		setText("");
		dismiss();
	}

	async function onConfirm() {
		if (!canConfirm) return;
		setBusy(true);
		try {
			await confirmDelete();
			setText("");
		} finally {
			setBusy(false);
		}
	}

	return {
		busy,
		canConfirm,
		confirmWord: CONFIRM_WORD,
		height,
		isPresented,
		onConfirm,
		onDismiss,
		placeholderColor: placeholder.color,
		setText,
		sheetBackground,
		text,
		width,
	};
}
