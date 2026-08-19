import { useMutation, useQueryClient } from "@tanstack/react-query";

import { homeKeys } from "@/features/home/home.queries";

import { completeDocumentUpload, createDocumentUpload } from "./documents.api";
import { prepareLocalFile, type LocalImageFile, type PreparedLocalFile } from "./document-file";
import { documentKeys } from "./documents.queries";
import type { CreateDocumentUploadInput, CreateDocumentUploadResult } from "./types";

export type DocumentIntakeInput = LocalImageFile & {
	userId: string;
	source: "camera" | "gallery";
	idempotencyKey: string;
};

export type DocumentIntakeResult = {
	documentId: string;
	duplicate: boolean;
};

export type DocumentIntakeDependencies = {
	prepare(file: LocalImageFile): Promise<PreparedLocalFile>;
	createUpload(input: CreateDocumentUploadInput): Promise<CreateDocumentUploadResult>;
	putToSignedUrl(url: string, uri: string, headers: Record<string, string>): Promise<void>;
	completeUpload(documentId: string): Promise<void>;
	invalidate(queryKey: readonly unknown[]): Promise<unknown>;
};

export class DocumentIntakeError extends Error {
	constructor(
		public readonly code: "UNSUPPORTED_TYPE" | "TOO_LARGE",
		message: string,
	) {
		super(message);
		this.name = "DocumentIntakeError";
	}
}

function mapPreparationError(error: unknown): never {
	if (error instanceof Error && error.message.includes("JPEG or PNG")) {
		throw new DocumentIntakeError("UNSUPPORTED_TYPE", error.message);
	}

	if (error instanceof Error && error.message.includes("15 MB")) {
		throw new DocumentIntakeError("TOO_LARGE", error.message);
	}

	throw error;
}

async function putLocalFileToSignedUrl(
	url: string,
	uri: string,
	headers: Record<string, string>,
): Promise<void> {
	const fileResponse = await fetch(uri);
	if (!fileResponse.ok) {
		throw new Error(`Unable to read local file (${fileResponse.status}).`);
	}

	const uploadResponse = await fetch(url, {
		method: "PUT",
		headers,
		body: await fileResponse.blob(),
	});
	if (!uploadResponse.ok) {
		throw new Error(`Signed upload failed with status ${uploadResponse.status}.`);
	}
}

export async function ingestLocalFile(
	{ userId: _userId, source, idempotencyKey, ...file }: DocumentIntakeInput,
	dependencies: DocumentIntakeDependencies,
): Promise<DocumentIntakeResult> {
	let prepared: PreparedLocalFile;
	try {
		prepared = await dependencies.prepare(file);
	} catch (error) {
		mapPreparationError(error);
	}

	const created = await dependencies.createUpload({
		source,
		originalFileName: prepared.originalFileName,
		mimeType: prepared.mimeType,
		sizeBytes: prepared.sizeBytes,
		sha256: prepared.sha256,
		pageCount: 1,
		idempotencyKey,
	});

	if (created.duplicate) {
		return { documentId: created.document.id, duplicate: true };
	}

	await dependencies.putToSignedUrl(created.upload.url, prepared.uri, created.upload.headers);
	await dependencies.completeUpload(created.document.id);
	await Promise.all([dependencies.invalidate(homeKeys.all), dependencies.invalidate(documentKeys.all)]);

	return { documentId: created.document.id, duplicate: false };
}

export function useDocumentIntake() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: DocumentIntakeInput) =>
			ingestLocalFile(input, {
				prepare: prepareLocalFile,
				createUpload: createDocumentUpload,
				putToSignedUrl: putLocalFileToSignedUrl,
				completeUpload: completeDocumentUpload,
				invalidate: (queryKey) => queryClient.invalidateQueries({ queryKey }),
			}),
	});
}
