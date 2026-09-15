import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { StorageService } from "../storage/storage.service.js";
import { DocumentsService } from "./documents.service.js";

describe("DocumentsService", () => {
	const storage = {
		upload: vi.fn(),
		delete: vi.fn(),
	} as unknown as StorageService;

	const ingestion = {
		process: vi.fn(),
	} as unknown as IngestionService;

	let db: {
		select: ReturnType<typeof vi.fn>;
		insert: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	let service: DocumentsService;

	beforeEach(() => {
		vi.clearAllMocks();
		db = {
			select: vi.fn(),
			insert: vi.fn(),
			update: vi.fn(),
		};
		service = new DocumentsService(db as never, storage, ingestion);
	});

	it("create: si existe el mismo sha256, no sube a R2 y devuelve el existente", async () => {
		const existing = {
			id: "doc-1",
			userId: "user-1",
			sha256: "ignored",
			objectKey: "users/user-1/documents/existing.jpg",
		};

		db.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([existing]),
				}),
			}),
		});

		const result = await service.create(
			"user-1",
			{ source: "camera" },
			{ buffer: Buffer.from("same-bytes"), size: 10, mimeType: "image/jpeg" },
		);

		expect(result).toBe(existing);
		expect(storage.upload).not.toHaveBeenCalled();
		expect(ingestion.process).not.toHaveBeenCalled();
	});

	it("softDelete: 404 si no hay fila visible", async () => {
		db.update.mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			}),
		});

		await expect(service.softDelete("user-1", "00000000-0000-4000-8000-000000000001")).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it("softDelete: marca deletedAt cuando existe", async () => {
		db.update.mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([{ id: "doc-1" }]),
				}),
			}),
		});

		await expect(service.softDelete("user-1", "doc-1")).resolves.toBeUndefined();
	});
});
