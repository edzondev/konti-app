import { apiClient } from "@/core/api-client";

import type {
	CreateDocumentUploadInput,
	CreateDocumentUploadResult,
	DocumentDetail,
	DocumentsPage,
} from "./types";

export function getDocuments(cursor?: string) {
	const search = cursor ? `?${new URLSearchParams({ cursor }).toString()}` : "";
	return apiClient<DocumentsPage>(`/v1/documents${search}`);
}

export function getDocument(documentId: string) {
	return apiClient<DocumentDetail>(`/v1/documents/${documentId}`);
}

export function createDocumentFileUrl(documentId: string) {
	return apiClient<{ url: string; expiresAt: string }>(`/v1/documents/${documentId}/file-url`, {
		method: "POST",
	});
}

export function createDocumentUpload(input: CreateDocumentUploadInput) {
	return apiClient<CreateDocumentUploadResult>("/v1/documents/uploads", {
		method: "POST",
		body: input,
	});
}

export function completeDocumentUpload(documentId: string) {
	return apiClient<void>(`/v1/documents/${documentId}/complete`, {
		method: "POST",
	});
}
