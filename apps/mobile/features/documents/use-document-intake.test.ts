import { File } from "expo-file-system";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { completeDocumentUpload, createDocumentUpload } from "./documents.api";
import { prepareLocalFile } from "./document-file";
import { ingestLocalFile } from "./use-document-intake";

vi.mock("./document-file", () => ({
	prepareLocalFile: vi.fn(),
}));

vi.mock("./documents.api", () => ({
	completeDocumentUpload: vi.fn(),
	createDocumentUpload: vi.fn(),
}));

vi.mock("./documents.queries", () => ({
	documentKeys: { all: ["documents"] },
}));

vi.mock("@/features/home/home.queries", () => ({
	homeKeys: { all: ["home"] },
}));

const prepare = vi.mocked(prepareLocalFile);
const createUpload = vi.mocked(createDocumentUpload);
const completeUpload = vi.mocked(completeDocumentUpload);

const preparedFile = {
	uri: "file:///cache/receipt.jpg",
	originalFileName: "receipt.jpg",
	mimeType: "image/jpeg" as const,
	sizeBytes: 42,
	sha256: "a".repeat(64),
};

const intakeInput = {
	uri: preparedFile.uri,
	source: "gallery" as const,
	idempotencyKey: "11111111-1111-4111-8111-111111111111",
	mimeType: preparedFile.mimeType,
	fileName: preparedFile.originalFileName,
};

describe("ingestLocalFile", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		prepare.mockResolvedValue(preparedFile);
		createUpload.mockResolvedValue({
			duplicate: false,
			document: { id: "document-1", status: "pending_upload" },
			upload: {
				url: "https://uploads.example.com/document-1",
				method: "PUT",
				headers: { "Content-Type": "image/jpeg", "x-amz-meta-sha256": preparedFile.sha256 },
				expiresAt: "2026-08-19T20:00:00.000Z",
			},
		});
		completeUpload.mockResolvedValue(undefined);
	});

	it("does not create an upload for an unsupported file", async () => {
		prepare.mockRejectedValue(new Error("Only JPEG or PNG images can be uploaded."));

		await expect(ingestLocalFile(intakeInput)).rejects.toThrow("JPEG or PNG");
		expect(createUpload).not.toHaveBeenCalled();
	});

	it("returns an existing duplicate without putting or completing it", async () => {
		const upload = vi.spyOn(File.prototype, "upload");
		createUpload.mockResolvedValue({
			duplicate: true,
			document: { id: "document-existing", status: "uploaded" },
		});

		await expect(ingestLocalFile(intakeInput)).resolves.toEqual({
			documentId: "document-existing",
			duplicate: true,
		});
		expect(upload).not.toHaveBeenCalled();
		expect(completeUpload).not.toHaveBeenCalled();
	});

	it("uploads and completes a new document", async () => {
		await expect(ingestLocalFile(intakeInput)).resolves.toEqual({
			documentId: "document-1",
			duplicate: false,
		});
		expect(createUpload).toHaveBeenCalledWith({
			source: "gallery",
			originalFileName: "receipt.jpg",
			mimeType: "image/jpeg",
			sizeBytes: 42,
			sha256: "a".repeat(64),
			pageCount: 1,
			idempotencyKey: "11111111-1111-4111-8111-111111111111",
		});
		expect(completeUpload).toHaveBeenCalledWith("document-1");
	});

	it("does not complete after a signed PUT failure", async () => {
		vi.spyOn(File.prototype, "upload").mockRejectedValueOnce(new Error("Network unavailable"));

		await expect(ingestLocalFile(intakeInput)).rejects.toThrow("Network unavailable");
		expect(completeUpload).not.toHaveBeenCalled();
	});
});
