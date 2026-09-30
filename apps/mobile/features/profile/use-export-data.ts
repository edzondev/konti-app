import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { usePostHog } from "posthog-react-native";
import { useRef, useState } from "react";

import { parse } from "valibot";

import { apiFetch } from "@/core/api-fetch";
import { trackFeature } from "@/core/funnel-events";
import { reportError } from "@/core/report-error";
import { showToast } from "@/core/toast";
import { MeExportSchema } from "@/features/profile/profile-schemas";

function localExportFileName(d = new Date()): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `konti-export-${y}-${m}-${day}.json`;
}

export function useExportData() {
	const posthog = usePostHog();
	const posthogRef = useRef(posthog);
	posthogRef.current = posthog;
	const [isExporting, setIsExporting] = useState(false);

	async function exportData() {
		if (isExporting) return;
		trackFeature(posthogRef.current, "export_requested");
		setIsExporting(true);
		try {
			const raw = await apiFetch<unknown>("/me/export");
			const data = parse(MeExportSchema, raw);
			const file = new File(Paths.cache, localExportFileName());
			if (file.exists) file.delete();
			file.create();
			file.write(JSON.stringify(data));
			await Sharing.shareAsync(file.uri);
			showToast("Archivo listo");
		} catch (error) {
			reportError("export data failed", error);
			showToast("No se pudo exportar. Intenta de nuevo.");
		} finally {
			setIsExporting(false);
		}
	}

	return { exportData: () => void exportData(), isExporting };
}
