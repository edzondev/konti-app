import { HttpStatus } from "@nestjs/common";
import type { ObjectStorage } from "../../core/storage/storage.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import { encodeDocumentCursor } from "./documents.cursor";
import { DocumentsService } from "./documents.service";
import type { CreateUploadInput } from "./documents.validation";

const profileId = "11111111-1111-4111-8111-111111111111";

const validInput: CreateUploadInput = {
	source: "camera",
	originalFileName: "receipt.jpg",
	mimeType: "image/jpeg",
	sizeBytes: 1_849_210,
	sha256: "a".repeat(64),
	pageCount: 1,
	idempotencyKey: "22222222-2222-4222-8222-222222222222",
};

type StoredDocument = {
	id: string;
	taxProfileId: string;
	status: "pending_upload" | "uploaded";
	idempotencyKey: string;
	objectKey: string;
	sha256: string;
	sizeBytes: number;
	mimeType: "image/jpeg" | "image/png";
	source: "camera" | "gallery";
	originalFileName: string;
	pageCount: number;
	deletedAt: Date | null;
	createdAt: Date;
};

function visibleDocument(id: string, createdAt: string): StoredDocument {
	return {
		id,
		taxProfileId: profileId,
		status: "uploaded",
		idempotencyKey: `${id}-idempotency-key`,
		objectKey: `users/user-1/tax/2026/documents/${id}/original.jpg`,
		sha256: `${id}`.padEnd(64, "0"),
		sizeBytes: 42,
		mimeType: "image/jpeg",
		source: "camera",
		originalFileName: `${id}.jpg`,
		pageCount: 1,
		deletedAt: null,
		createdAt: new Date(createdAt),
	};
}

function createHarness(options: { requiresOnboarding?: boolean } = {}) {
	const rows = new Map<string, StoredDocument>();
	const repository = {
		findByIdempotencyKey: jest.fn(async (taxProfileId: string, key: string) =>
			[...rows.values()].find(
				(row) => row.taxProfileId === taxProfileId && row.idempotencyKey === key,
			),
		),
		findVisibleBySha256: jest.fn(async (taxProfileId: string, sha256: string) =>
			[...rows.values()].find(
				(row) =>
					row.taxProfileId === taxProfileId && row.sha256 === sha256 && row.deletedAt === null,
			),
		),
		insertPending: jest.fn(async (row: StoredDocument) => {
			rows.set(row.id, row);
			return row;
		}),
		updateStatus: jest.fn(
			async (
				id: string,
				fromStatus: StoredDocument["status"],
				toStatus: StoredDocument["status"],
			) => {
				const row = rows.get(id);
				if (!row || row.status !== fromStatus) return false;
				row.status = toStatus;
				return true;
			},
		),
		getOwned: jest.fn(async (taxProfileId: string, documentId: string) => {
			const row = rows.get(documentId);
			return row?.taxProfileId === taxProfileId ? row : undefined;
		}),
		listVisible: jest.fn(
			async (
				taxProfileId: string,
				query: { cursor?: { createdAt: Date; id: string }; limit: number },
			) =>
				[...rows.values()]
					.filter(
						(row) =>
							row.taxProfileId === taxProfileId &&
							row.status === "uploaded" &&
							row.deletedAt === null &&
							(!query.cursor ||
								row.createdAt < query.cursor.createdAt ||
								(row.createdAt.getTime() === query.cursor.createdAt.getTime() &&
									row.id < query.cursor.id)),
					)
					.sort(
						(left, right) =>
							right.createdAt.getTime() - left.createdAt.getTime() ||
							right.id.localeCompare(left.id),
					)
					.slice(0, query.limit + 1),
		),
	};
	const storage = {
		createUploadUrl: jest.fn().mockResolvedValue({
			url: "https://storage.example/upload",
			headers: { "Content-Type": "image/jpeg" },
			expiresAt: "2026-08-19T12:00:00.000Z",
		}),
		createDownloadUrl: jest.fn(),
		headObject: jest.fn().mockResolvedValue({ exists: true, sizeBytes: validInput.sizeBytes }),
	};
	const taxProfileService = {
		getCurrentUser: jest.fn().mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: options.requiresOnboarding ?? false,
			profile: { id: profileId },
		}),
	};

	return {
		service: new DocumentsService(
			repository,
			storage as jest.Mocked<ObjectStorage>,
			taxProfileService as unknown as TaxProfileService,
		),
		repository,
		rows,
		storage,
	};
}

describe("DocumentsService", () => {
	it("rejects uploads when the tax profile is incomplete", async () => {
		const { service } = createHarness({ requiresOnboarding: true });

		await expect(service.createUpload("user-1", validInput)).rejects.toMatchObject({
			response: {
				code: "PROFILE_INCOMPLETE",
			},
			status: HttpStatus.CONFLICT,
		});
	});

	it("inserts a pending document and returns a signed PUT upload", async () => {
		const { service, repository, storage } = createHarness();

		const result = await service.createUpload("user-1", validInput);

		expect(repository.insertPending).toHaveBeenCalledTimes(1);
		expect(result).toEqual({
			duplicate: false,
			document: expect.objectContaining({ status: "pending_upload" }),
			upload: {
				url: "https://storage.example/upload",
				method: "PUT",
				headers: { "Content-Type": "image/jpeg" },
				expiresAt: "2026-08-19T12:00:00.000Z",
			},
		});
		expect(storage.createUploadUrl).toHaveBeenCalledWith(
			expect.objectContaining({ mimeType: "image/jpeg", expiresInSeconds: 300 }),
		);
		expect(JSON.stringify(result)).not.toContain("objectKey");
	});

	it("re-signs a pending document for the same idempotency key without inserting again", async () => {
		const { service, repository, storage } = createHarness();

		const first = await service.createUpload("user-1", validInput);
		const second = await service.createUpload("user-1", validInput);

		expect(repository.insertPending).toHaveBeenCalledTimes(1);
		expect(storage.createUploadUrl).toHaveBeenCalledTimes(2);
		expect(second).toMatchObject({
			duplicate: false,
			document: { id: first.document.id, status: "pending_upload" },
		});
	});

	it("returns the winning request when a concurrent idempotency-key insert conflicts", async () => {
		const { service, repository, storage, rows } = createHarness();
		const winningDocument: StoredDocument = {
			id: "winning-document",
			taxProfileId: profileId,
			status: "pending_upload",
			idempotencyKey: validInput.idempotencyKey,
			objectKey: "users/user-1/tax/2026/documents/winning-document/original.jpg",
			sha256: validInput.sha256,
			sizeBytes: validInput.sizeBytes,
			mimeType: validInput.mimeType,
			source: validInput.source,
			originalFileName: validInput.originalFileName,
			pageCount: validInput.pageCount,
			deletedAt: null,
			createdAt: new Date("2026-08-19T12:00:00.000Z"),
		};
		repository.findByIdempotencyKey
			.mockResolvedValueOnce(undefined)
			.mockImplementation(async () => winningDocument);
		repository.insertPending.mockImplementationOnce(async () => {
			rows.set(winningDocument.id, winningDocument);
			throw { code: "23505", constraint: "documents_profile_idempotency_uidx" };
		});

		const result = await service.createUpload("user-1", validInput);

		expect(result).toMatchObject({
			duplicate: false,
			document: { id: winningDocument.id, status: "pending_upload" },
		});
		expect(repository.findByIdempotencyKey).toHaveBeenCalledTimes(2);
		expect(storage.createUploadUrl).toHaveBeenCalledWith(
			expect.objectContaining({ objectKey: winningDocument.objectKey }),
		);
		expect(JSON.stringify(result)).not.toContain("objectKey");
	});

	it("returns a duplicate without signing an upload for a matching visible file", async () => {
		const { service, storage } = createHarness();
		await service.createUpload("user-1", validInput);

		const result = await service.createUpload("user-1", {
			...validInput,
			idempotencyKey: "33333333-3333-4333-8333-333333333333",
		});

		expect(result).toMatchObject({
			duplicate: true,
			document: { status: "pending_upload" },
		});
		expect(storage.createUploadUrl).toHaveBeenCalledTimes(1);
		expect(JSON.stringify(result)).not.toContain("objectKey");
	});

	it("returns the winning visible document when a concurrent SHA-256 insert conflicts", async () => {
		const { service, repository, storage, rows } = createHarness();
		const winningDocument: StoredDocument = {
			id: "winning-document",
			taxProfileId: profileId,
			status: "pending_upload",
			idempotencyKey: "33333333-3333-4333-8333-333333333333",
			objectKey: "users/user-1/tax/2026/documents/winning-document/original.jpg",
			sha256: validInput.sha256,
			sizeBytes: validInput.sizeBytes,
			mimeType: validInput.mimeType,
			source: validInput.source,
			originalFileName: validInput.originalFileName,
			pageCount: validInput.pageCount,
			deletedAt: null,
			createdAt: new Date("2026-08-19T12:00:00.000Z"),
		};
		repository.findVisibleBySha256
			.mockResolvedValueOnce(undefined)
			.mockImplementation(async () => winningDocument);
		repository.insertPending.mockImplementationOnce(async () => {
			rows.set(winningDocument.id, winningDocument);
			throw { code: "23505", constraint: "documents_profile_sha256_visible_uidx" };
		});

		const result = await service.createUpload("user-1", validInput);

		expect(result).toEqual({
			duplicate: true,
			document: { id: winningDocument.id, status: "pending_upload" },
		});
		expect(repository.findVisibleBySha256).toHaveBeenCalledTimes(2);
		expect(storage.createUploadUrl).not.toHaveBeenCalled();
		expect(JSON.stringify(result)).not.toContain("objectKey");
	});

	it("rejects completion when the object does not exist", async () => {
		const { service, storage } = createHarness();
		const created = await service.createUpload("user-1", validInput);
		storage.headObject.mockResolvedValue({ exists: false, sizeBytes: null });

		await expect(service.completeUpload("user-1", created.document.id)).rejects.toMatchObject({
			response: { code: "UPLOAD_INCOMPLETE" },
			status: HttpStatus.CONFLICT,
		});
	});

	it("rejects completion when object size differs from the declared size", async () => {
		const { service, storage } = createHarness();
		const created = await service.createUpload("user-1", validInput);
		storage.headObject.mockResolvedValue({ exists: true, sizeBytes: validInput.sizeBytes + 1 });

		await expect(service.completeUpload("user-1", created.document.id)).rejects.toMatchObject({
			response: { code: "UPLOAD_SIZE_MISMATCH" },
			status: HttpStatus.CONFLICT,
		});
	});

	it("marks a verified pending document as uploaded", async () => {
		const { service } = createHarness();
		const created = await service.createUpload("user-1", validInput);

		await expect(service.completeUpload("user-1", created.document.id)).resolves.toEqual({
			id: created.document.id,
			status: "uploaded",
		});
	});

	it("returns success when an uploaded document is completed again", async () => {
		const { service, storage } = createHarness();
		const created = await service.createUpload("user-1", validInput);
		await service.completeUpload("user-1", created.document.id);
		storage.headObject.mockClear();

		await expect(service.completeUpload("user-1", created.document.id)).resolves.toEqual({
			id: created.document.id,
			status: "uploaded",
		});
		expect(storage.headObject).not.toHaveBeenCalled();
	});

	it("returns not found for a missing document", async () => {
		const { service } = createHarness();

		await expect(service.completeUpload("user-1", "missing-id")).rejects.toMatchObject({
			status: HttpStatus.NOT_FOUND,
		});
	});

	it("returns not found for a document owned by another profile", async () => {
		const { service, rows } = createHarness();
		rows.set("other-document", {
			id: "other-document",
			taxProfileId: "99999999-9999-4999-8999-999999999999",
			status: "pending_upload",
			idempotencyKey: "44444444-4444-4444-8444-444444444444",
			objectKey: "users/other/tax/2026/documents/other-document/original.jpg",
			sha256: "b".repeat(64),
			sizeBytes: validInput.sizeBytes,
			mimeType: "image/jpeg",
			source: "camera",
			originalFileName: "other.jpg",
			pageCount: 1,
			deletedAt: null,
			createdAt: new Date("2026-08-19T12:00:00.000Z"),
		});

		await expect(service.completeUpload("user-1", "other-document")).rejects.toMatchObject({
			status: HttpStatus.NOT_FOUND,
		});
	});

	it("lists visible uploaded documents with signed previews and a next cursor", async () => {
		const { service, rows, storage } = createHarness();
		rows.set("newer", visibleDocument("newer", "2026-08-19T12:00:00.000Z"));
		rows.set("older", visibleDocument("older", "2026-08-18T12:00:00.000Z"));
		rows.set("pending", { ...visibleDocument("pending", "2026-08-17T12:00:00.000Z"), status: "pending_upload" });
		rows.set("deleted", {
			...visibleDocument("deleted", "2026-08-16T12:00:00.000Z"),
			deletedAt: new Date(),
		});
		storage.createDownloadUrl.mockResolvedValue({
			url: "https://storage.example/preview",
			expiresAt: "2026-08-19T12:05:00.000Z",
		});

		const result = await service.list("user-1", { limit: 1 });

		expect(result).toEqual({
			items: [
				{
					id: "newer",
					status: "uploaded",
					source: "camera",
					createdAt: "2026-08-19T12:00:00.000Z",
					originalFileName: "newer.jpg",
					mimeType: "image/jpeg",
					previewUrl: "https://storage.example/preview",
					previewExpiresAt: "2026-08-19T12:05:00.000Z",
				},
			],
			nextCursor: encodeDocumentCursor({
				createdAt: "2026-08-19T12:00:00.000Z",
				id: "newer",
			}),
		});
		expect(storage.createDownloadUrl).toHaveBeenCalledWith({
			objectKey: "users/user-1/tax/2026/documents/newer/original.jpg",
			expiresInSeconds: 300,
		});
		expect(JSON.stringify(result)).not.toContain("objectKey");
	});

	it("uses a decoded cursor and caps the list limit at 50", async () => {
		const { service, repository } = createHarness();
		const cursor = encodeDocumentCursor({
			createdAt: "2026-08-18T12:00:00.000Z",
			id: "older",
		});

		await service.list("user-1", { cursor, limit: 100 });

		expect(repository.listVisible).toHaveBeenCalledWith(profileId, {
			cursor: { createdAt: new Date("2026-08-18T12:00:00.000Z"), id: "older" },
			limit: 50,
		});
	});

	it("returns not found for pending and deleted documents", async () => {
		const { service, rows } = createHarness();
		rows.set("pending", { ...visibleDocument("pending", "2026-08-19T12:00:00.000Z"), status: "pending_upload" });
		rows.set("deleted", {
			...visibleDocument("deleted", "2026-08-19T12:00:00.000Z"),
			deletedAt: new Date(),
		});

		for (const id of ["pending", "deleted"]) {
			await expect(service.getOne("user-1", id)).rejects.toMatchObject({
				status: HttpStatus.NOT_FOUND,
			});
			await expect(service.createFileUrl("user-1", id)).rejects.toMatchObject({
				status: HttpStatus.NOT_FOUND,
			});
		}
	});

	it("returns a visible document detail and signed file URL without objectKey", async () => {
		const { service, rows, storage } = createHarness();
		rows.set("visible", visibleDocument("visible", "2026-08-19T12:00:00.000Z"));
		storage.createDownloadUrl.mockResolvedValue({
			url: "https://storage.example/original",
			expiresAt: "2026-08-19T12:05:00.000Z",
		});

		const detail = await service.getOne("user-1", "visible");
		const file = await service.createFileUrl("user-1", "visible");

		expect(detail).toEqual({
			document: {
				id: "visible",
				status: "uploaded",
				source: "camera",
				createdAt: "2026-08-19T12:00:00.000Z",
				originalFileName: "visible.jpg",
				mimeType: "image/jpeg",
			},
			processing: null,
			attention: null,
		});
		expect(file).toEqual({
			url: "https://storage.example/original",
			expiresAt: "2026-08-19T12:05:00.000Z",
		});
		expect(JSON.stringify({ detail, file })).not.toContain("objectKey");
	});
});
