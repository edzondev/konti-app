import { HttpStatus } from "@nestjs/common";
import type { ObjectStorage } from "../../core/storage/storage.types";
import type { TaxDeductionService } from "../tax-deductions/tax-deduction.service";
import type { TaxIncomeService } from "../tax-income/tax-income.service";
import type { TaxProfileService } from "../tax-profile/tax-profile.service";
import { encodeDocumentCursor } from "./documents.cursor";
import { DocumentsService } from "./documents.service";
import type { DocumentRecord } from "./documents.types";
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

type StoredDocument = DocumentRecord;

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
		documentType: "unknown",
		issuerName: null,
		issuerTaxId: null,
		documentNumber: null,
		totalAmount: null,
		subtotalAmount: null,
		taxAmount: null,
		currencyCode: null,
		issueDate: null,
		metadata: {},
		deletedAt: null,
		createdAt: new Date(createdAt),
	};
}

function publicDocumentFields(id: string, createdAt: string) {
	return {
		id,
		status: "uploaded" as const,
		source: "camera" as const,
		createdAt,
		originalFileName: `${id}.jpg`,
		mimeType: "image/jpeg",
		issuerName: null,
		issuerTaxId: null,
		documentNumber: null,
		totalAmount: null,
		subtotalAmount: null,
		taxAmount: null,
		currencyCode: null,
		documentType: "unknown",
		issueDate: null,
		doubtfulFields: [] as const,
	};
}

function createHarness(
	options: {
		requiresOnboarding?: boolean;
		incomeMode?: "employment" | "independent" | "mixed";
		trackDeductibles?: boolean;
	} = {},
) {
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
							row.status !== "pending_upload" &&
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
		countVisible: jest.fn(
			async (taxProfileId: string) =>
				[...rows.values()].filter(
					(row) =>
						row.taxProfileId === taxProfileId &&
						row.status !== "pending_upload" &&
						row.deletedAt === null,
				).length,
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
		putObject: jest.fn().mockResolvedValue(undefined),
	};
	const taxProfileService = {
		getCurrentUser: jest.fn().mockResolvedValue({
			taxYear: 2026,
			requiresOnboarding: options.requiresOnboarding ?? false,
			profile: {
				id: profileId,
				incomeMode: options.incomeMode ?? "independent",
				trackDeductibles: options.trackDeductibles ?? false,
			},
		}),
	};
	const taxIncomeService = {
		getDocumentCandidateForProfile: jest.fn().mockResolvedValue(null),
		getEmploymentDocumentCandidateForProfile: jest.fn().mockResolvedValue(null),
	};
	const taxDeductionService = {
		getDocumentCandidateForProfile: jest.fn().mockResolvedValue(null),
	};

	return {
		service: new DocumentsService(
			repository,
			storage as jest.Mocked<ObjectStorage>,
			taxProfileService as unknown as TaxProfileService,
			taxIncomeService as unknown as TaxIncomeService,
			taxDeductionService as unknown as TaxDeductionService,
		),
		repository,
		rows,
		storage,
		taxIncomeService,
		taxDeductionService,
	};
}

describe("DocumentsService", () => {
	it("counts visible documents including ready and ignores pending uploads", async () => {
		const { service, rows } = createHarness();
		rows.set("ready", {
			...visibleDocument("ready", "2026-08-19T12:00:00.000Z"),
			status: "ready",
		});
		rows.set("pending", {
			...visibleDocument("pending", "2026-08-19T12:00:00.000Z"),
			status: "pending_upload",
		});

		await expect(service.countVisible("user-1")).resolves.toBe(1);
	});

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
			...visibleDocument("winning-document", "2026-08-19T12:00:00.000Z"),
			status: "pending_upload",
			idempotencyKey: validInput.idempotencyKey,
			objectKey: "users/user-1/tax/2026/documents/winning-document/original.jpg",
			sha256: validInput.sha256,
			sizeBytes: validInput.sizeBytes,
			originalFileName: validInput.originalFileName,
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
			...visibleDocument("winning-document", "2026-08-19T12:00:00.000Z"),
			status: "pending_upload",
			idempotencyKey: "33333333-3333-4333-8333-333333333333",
			objectKey: "users/user-1/tax/2026/documents/winning-document/original.jpg",
			sha256: validInput.sha256,
			sizeBytes: validInput.sizeBytes,
			originalFileName: validInput.originalFileName,
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
			...visibleDocument("other-document", "2026-08-19T12:00:00.000Z"),
			taxProfileId: "99999999-9999-4999-8999-999999999999",
			status: "pending_upload",
			idempotencyKey: "44444444-4444-4444-8444-444444444444",
			objectKey: "users/other/tax/2026/documents/other-document/original.jpg",
			sha256: "b".repeat(64),
			originalFileName: "other.jpg",
		});

		await expect(service.completeUpload("user-1", "other-document")).rejects.toMatchObject({
			status: HttpStatus.NOT_FOUND,
		});
	});

	it("lists visible uploaded documents with signed previews and a next cursor", async () => {
		const { service, rows, storage } = createHarness();
		rows.set("newer", visibleDocument("newer", "2026-08-19T12:00:00.000Z"));
		rows.set("older", visibleDocument("older", "2026-08-18T12:00:00.000Z"));
		rows.set("pending", {
			...visibleDocument("pending", "2026-08-17T12:00:00.000Z"),
			status: "pending_upload",
		});
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
					...publicDocumentFields("newer", "2026-08-19T12:00:00.000Z"),
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

	it("seeks the next page from the stored cursor row timestamp and caps the list limit at 50", async () => {
		const { service, repository, rows, storage } = createHarness();
		rows.set("cursor-row", visibleDocument("cursor-row", "2026-08-18T12:00:00.001Z"));
		rows.set("older", visibleDocument("older", "2026-08-18T12:00:00.000Z"));
		storage.createDownloadUrl.mockResolvedValue({
			url: "https://storage.example/preview",
			expiresAt: "2026-08-19T12:05:00.000Z",
		});
		const cursor = encodeDocumentCursor({
			createdAt: "2026-08-18T12:00:00.000Z",
			id: "cursor-row",
		});

		const result = await service.list("user-1", { cursor, limit: 100 });

		expect(repository.listVisible).toHaveBeenCalledWith(profileId, {
			cursor: { createdAt: new Date("2026-08-18T12:00:00.001Z"), id: "cursor-row" },
			limit: 50,
		});
		expect(result.items.map((item) => item.id)).toEqual(["older"]);
	});

	it("rejects a cursor whose document is missing or not owned", async () => {
		const { service } = createHarness();
		const cursor = encodeDocumentCursor({
			createdAt: "2026-08-18T12:00:00.000Z",
			id: "missing",
		});

		await expect(service.list("user-1", { cursor })).rejects.toThrow("Invalid document cursor");
	});

	it("returns not found for pending and deleted documents", async () => {
		const { service, rows } = createHarness();
		rows.set("pending", {
			...visibleDocument("pending", "2026-08-19T12:00:00.000Z"),
			status: "pending_upload",
		});
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
			document: publicDocumentFields("visible", "2026-08-19T12:00:00.000Z"),
			processing: null,
			attention: null,
			taxIncomeCandidate: null,
			fourthIncomeCandidate: null,
			employmentIncomeCandidate: null,
			taxDeductionCandidate: null,
		});
		expect(file).toEqual({
			url: "https://storage.example/original",
			expiresAt: "2026-08-19T12:05:00.000Z",
		});
		expect(JSON.stringify({ detail, file })).not.toContain("objectKey");
	});

	it("includes a fee-receipt candidate without inferring payment date", async () => {
		const { service, rows, taxIncomeService } = createHarness();
		rows.set("rhe", {
			...visibleDocument("rhe", "2026-08-19T12:00:00.000Z"),
			status: "ready",
			documentType: "fee_receipt",
			currencyCode: "PEN",
			issueDate: "2026-08-12",
		});
		taxIncomeService.getDocumentCandidateForProfile.mockResolvedValueOnce({
			eligibility: "insufficient_fields",
			issueDate: "2026-08-12",
			paymentDate: null,
			grossAmount: "2500.00",
			withheldTaxAmount: "200.00",
			netPaidAmount: "2300.00",
			payerName: "Cliente SAC",
			warnings: ["missing_payment_date"],
		});

		const detail = await service.getOne("user-1", "rhe");

		expect(detail.taxIncomeCandidate).toMatchObject({
			eligibility: "insufficient_fields",
			issueDate: "2026-08-12",
			paymentDate: null,
			warnings: ["missing_payment_date"],
		});
	});

	it.each(["employment"] as const)(
		"does not expose a fourth-income candidate for a %s profile",
		async (incomeMode) => {
			const { service, rows, taxIncomeService } = createHarness({ incomeMode });
			rows.set("rhe", {
				...visibleDocument("rhe", "2026-08-19T12:00:00.000Z"),
				status: "ready",
				documentType: "fee_receipt",
				currencyCode: "PEN",
			});

			await expect(service.getOne("user-1", "rhe")).resolves.toMatchObject({
				taxIncomeCandidate: null,
			});
			expect(taxIncomeService.getDocumentCandidateForProfile).not.toHaveBeenCalled();
		},
	);

	it("checks both candidate kinds for a mixed profile", async () => {
		const { service, rows, taxIncomeService } = createHarness({ incomeMode: "mixed" });
		rows.set("document", {
			...visibleDocument("document", "2026-08-19T12:00:00.000Z"),
			status: "ready",
		});

		await service.getOne("user-1", "document");

		expect(taxIncomeService.getDocumentCandidateForProfile).toHaveBeenCalledTimes(1);
		expect(taxIncomeService.getEmploymentDocumentCandidateForProfile).toHaveBeenCalledTimes(1);
	});

	it("exposes a deduction candidate only when deductible tracking is enabled", async () => {
		const { service, rows, taxDeductionService } = createHarness({ trackDeductibles: true });
		rows.set("restaurant", {
			...visibleDocument("restaurant", "2026-08-19T12:00:00.000Z"),
			status: "ready",
			currencyCode: "PEN",
			issueDate: "2026-08-19",
		});
		taxDeductionService.getDocumentCandidateForProfile.mockResolvedValueOnce({
			categoryHint: "restaurants_hotels",
			expenseDate: "2026-08-19",
			grossAmount: "100.00",
			insuranceReimbursementAmount: null,
			serviceDescription: "Consumo",
			paymentMethodEvidence: null,
			propertyCountry: null,
			propertyUse: null,
			supportingFormNumber: null,
			workerRegistrationEvidence: null,
			attributionHint: null,
			verificationStatus: "evidence_attached",
			calculationStatus: "potential",
			warnings: ["Confirma los requisitos antes de incluir este gasto."],
		});

		await expect(service.getOne("user-1", "restaurant")).resolves.toMatchObject({
			taxDeductionCandidate: {
				categoryHint: "restaurants_hotels",
				verificationStatus: "evidence_attached",
				calculationStatus: "potential",
			},
		});
	});

	it("exposes extracted fields and review hints on a needs_review document", async () => {
		const { service, rows } = createHarness();
		rows.set("review", {
			...visibleDocument("review", "2026-08-19T12:00:00.000Z"),
			status: "needs_review",
			issuerName: "Tambo",
			totalAmount: "12.50",
			currencyCode: "PEN",
			documentType: "receipt",
			issueDate: "2026-08-12",
			metadata: { doubtfulFields: ["issuerTaxId"], attemptNumber: 1 },
		});

		const detail = await service.getOne("user-1", "review");

		expect(detail.document).toMatchObject({
			status: "needs_review",
			issuerName: "Tambo",
			issuerTaxId: null,
			totalAmount: "12.50",
			currencyCode: "PEN",
			documentType: "receipt",
			issueDate: "2026-08-12",
			doubtfulFields: ["issuerTaxId"],
		});
		expect(detail.processing).toEqual({
			status: "succeeded",
			attemptNumber: 1,
			doubtfulFields: ["issuerTaxId"],
		});
	});
});
