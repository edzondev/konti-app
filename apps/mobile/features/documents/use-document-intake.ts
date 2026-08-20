import { useMutation, useQueryClient } from "@tanstack/react-query";
import { File } from "expo-file-system";

import { createDevLogger } from "@/core/dev-logger";
import { homeKeys } from "@/features/home/home.queries";
import { type LocalImageFile, prepareLocalFile } from "./document-file";
import { completeDocumentUpload, createDocumentUpload } from "./documents.api";
import { documentKeys } from "./documents.queries";

const log = createDevLogger("documents");

export type DocumentIntakeInput = LocalImageFile & {
	source: "camera" | "gallery";
	idempotencyKey: string;
};

export async function ingestLocalFile(input: DocumentIntakeInput) {
	const prepared = await prepareLocalFile(input);
	log.info("prepare", { sizeBytes: prepared.sizeBytes, mimeType: prepared.mimeType });

	const created = await createDocumentUpload({
		source: input.source,
		originalFileName: prepared.originalFileName,
		mimeType: prepared.mimeType,
		sizeBytes: prepared.sizeBytes,
		sha256: prepared.sha256,
		pageCount: 1,
		idempotencyKey: input.idempotencyKey,
	});
	log.info("createUpload", { documentId: created.document.id, duplicate: created.duplicate });

	if (created.duplicate) {
		return { documentId: created.document.id, duplicate: true };
	}

	const result = await new File(prepared.uri).upload(created.upload.url, {
		httpMethod: "PUT",
		headers: created.upload.headers,
	});
	if (result.status < 200 || result.status >= 300) {
		log.error("PUT failed", { status: result.status, body: result.body.slice(0, 400) });
		throw new Error(`Signed upload failed with status ${result.status}.`);
	}
	log.info("PUT ok", { status: result.status });

	await completeDocumentUpload(created.document.id);
	log.info("complete", { documentId: created.document.id });

	return { documentId: created.document.id, duplicate: false };
}

export function useDocumentIntake() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ingestLocalFile,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: homeKeys.all }),
				queryClient.invalidateQueries({ queryKey: documentKeys.all }),
			]),
		onError: (error) => {
			log.error("intake failed", error);
		},
	});
}
