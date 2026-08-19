import { HttpStatus } from "@nestjs/common";
import type { ObjectStorage } from "../../core/storage/storage.types";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import type { CreateUploadInput } from "./documents.validation";
import { DocumentsService } from "./documents.service";

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
};

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
		});

		await expect(service.completeUpload("user-1", "other-document")).rejects.toMatchObject({
			status: HttpStatus.NOT_FOUND,
		});
	});
});
