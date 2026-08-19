import { describe, expect, it, vi } from "vitest";

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

import {
	DocumentIntakeError,
	ingestLocalFile,
	type DocumentIntakeDependencies,
} from "./use-document-intake";

const preparedFile = {
	uri: "file:///cache/receipt.jpg",
	originalFileName: "receipt.jpg",
	mimeType: "image/jpeg" as const,
	sizeBytes: 42,
	sha256: "a".repeat(64),
};

function createDependencies(
	overrides: Partial<DocumentIntakeDependencies> = {},
): DocumentIntakeDependencies {
	return {
		prepare: vi.fn(async () => preparedFile),
		createUpload: vi.fn(async () => ({
			duplicate: false as const,
			document: { id: "document-1", status: "pending_upload" as const },
			upload: {
				url: "https://uploads.example.com/document-1",
				method: "PUT" as const,
				headers: { "Content-Type": "image/jpeg", "x-amz-meta-sha256": preparedFile.sha256 },
				expiresAt: "2026-08-19T20:00:00.000Z",
			},
		})),
		putToSignedUrl: vi.fn(async () => undefined),
		completeUpload: vi.fn(async () => undefined),
		invalidate: vi.fn(async () => undefined),
		...overrides,
	};
}

const intakeInput = {
	userId: "user-1",
	uri: preparedFile.uri,
	source: "gallery" as const,
	idempotencyKey: "11111111-1111-4111-8111-111111111111",
	mimeType: preparedFile.mimeType,
	fileName: preparedFile.originalFileName,
};

describe("ingestLocalFile", () => {
	it("maps unsupported files and does not create an upload", async () => {
		const dependencies = createDependencies({
			prepare: vi.fn(async () => {
				throw new Error("Only JPEG or PNG images can be uploaded.");
			}),
		});

		await expect(ingestLocalFile(intakeInput, dependencies)).rejects.toMatchObject(
			new DocumentIntakeError("UNSUPPORTED_TYPE", "Only JPEG or PNG images can be uploaded."),
		);

		expect(dependencies.createUpload).not.toHaveBeenCalled();
		expect(dependencies.putToSignedUrl).not.toHaveBeenCalled();
	});

	it("returns an existing duplicate without putting or completing it", async () => {
		const dependencies = createDependencies({
			createUpload: vi.fn(async () => ({
				duplicate: true as const,
				document: { id: "document-existing", status: "uploaded" },
			})),
		});

		await expect(ingestLocalFile(intakeInput, dependencies)).resolves.toEqual({
			documentId: "document-existing",
			duplicate: true,
		});
		expect(dependencies.putToSignedUrl).not.toHaveBeenCalled();
		expect(dependencies.completeUpload).not.toHaveBeenCalled();
		expect(dependencies.invalidate).not.toHaveBeenCalled();
	});

	it("uploads, completes, and invalidates home and document queries", async () => {
		const dependencies = createDependencies();

		await expect(ingestLocalFile(intakeInput, dependencies)).resolves.toEqual({
			documentId: "document-1",
			duplicate: false,
		});
		expect(dependencies.createUpload).toHaveBeenCalledWith({
			source: "gallery",
			originalFileName: "receipt.jpg",
			mimeType: "image/jpeg",
			sizeBytes: 42,
			sha256: "a".repeat(64),
			pageCount: 1,
			idempotencyKey: "11111111-1111-4111-8111-111111111111",
		});
		expect(dependencies.putToSignedUrl).toHaveBeenCalledWith(
			"https://uploads.example.com/document-1",
			"file:///cache/receipt.jpg",
			{ "Content-Type": "image/jpeg", "x-amz-meta-sha256": "a".repeat(64) },
		);
		expect(dependencies.completeUpload).toHaveBeenCalledWith("document-1");
		expect(dependencies.invalidate).toHaveBeenCalledWith(["home"]);
		expect(dependencies.invalidate).toHaveBeenCalledWith(["documents"]);
	});

	it("does not complete after a signed PUT failure", async () => {
		const putError = new Error("Network unavailable");
		const dependencies = createDependencies({
			putToSignedUrl: vi.fn(async () => {
				throw putError;
			}),
		});

		await expect(ingestLocalFile(intakeInput, dependencies)).rejects.toThrow(putError);
		expect(dependencies.completeUpload).not.toHaveBeenCalled();
		expect(dependencies.invalidate).not.toHaveBeenCalled();
	});
});
