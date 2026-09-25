import { apiFetch } from "@/core/api-fetch";
import { reportError } from "@/core/report-error";

function documentFields(input: { source: "camera" | "gallery"; qrPayload?: string | null }): {
	source: "camera" | "gallery";
	qrPayload?: string;
} {
	const qrPayload = input.qrPayload?.trim();
	if (!qrPayload || qrPayload.length > 2000) return { source: input.source };
	return { source: input.source, qrPayload };
}

function buildDocumentFormData(input: {
	file: Blob;
	filename: string;
	source: "camera" | "gallery";
	qrPayload?: string | null;
}): FormData {
	const fields = documentFields(input);
	const body = new FormData();
	// RN's FormData type only lists two arguments. The runtime accepts the filename.
	const append = body.append.bind(body) as (name: string, value: Blob, filename?: string) => void;
	append("file", input.file, input.filename);
	body.append("source", fields.source);
	if (fields.qrPayload) body.append("qrPayload", fields.qrPayload);
	return body;
}

export async function uploadDocument(input: {
	file: Blob;
	filename: string;
	source: "camera" | "gallery";
	qrPayload?: string | null;
}): Promise<void> {
	try {
		await apiFetch("/documents", {
			method: "POST",
			body: buildDocumentFormData(input),
		});
	} catch (error) {
		reportError("[scan] POST /documents failed", error);
		throw error;
	}
}
