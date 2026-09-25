import { Logger, NotFoundException } from "@nestjs/common";
import { PostHog } from "posthog-node";
import * as v from "valibot";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { StorageService } from "../storage/storage.service.js";
import { UpdateDocumentSchema } from "./documents.dto.js";
import { DocumentsService } from "./documents.service.js";

describe("DocumentsService", () => {
	const storage = {
		upload: vi.fn(),
		delete: vi.fn(),
	} as unknown as StorageService;

	const ingestion = {
		process: vi.fn(),
	} as unknown as IngestionService;

	const posthog = {
		capture: vi.fn(),
	} as unknown as PostHog;

	let db: {
		select: ReturnType<typeof vi.fn>;
		insert: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
	};
	let service: DocumentsService;

	const upload = {
		buffer: Buffer.from("same-bytes"),
		size: 10,
		mimeType: "image/jpeg" as const,
	};

	function mockExisting(row: Record<string, unknown>) {
		db.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([row]),
				}),
			}),
		});
	}

	beforeEach(() => {
		vi.clearAllMocks();
		db = {
			select: vi.fn(),
			insert: vi.fn(),
			update: vi.fn(),
		};
		service = new DocumentsService(db as never, storage, ingestion, posthog);
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
		expect(posthog.capture).not.toHaveBeenCalled();
	});

	it("create: pending en proceso (extractionSource null) no relanza la ingesta", async () => {
		const existing = {
			id: "doc-pending",
			status: "pending",
			extractionSource: null,
		};
		mockExisting(existing);

		const result = await service.create("user-1", { source: "camera" }, upload);

		expect(result).toBe(existing);
		expect(storage.upload).not.toHaveBeenCalled();
		expect(ingestion.process).not.toHaveBeenCalled();
		expect(db.update).not.toHaveBeenCalled();
	});

	it("create: pending manual no relanza la ingesta", async () => {
		const existing = {
			id: "doc-manual",
			status: "pending",
			extractionSource: "manual",
		};
		mockExisting(existing);

		const result = await service.create("user-1", { source: "gallery" }, upload);

		expect(result).toBe(existing);
		expect(ingestion.process).not.toHaveBeenCalled();
		expect(db.update).not.toHaveBeenCalled();
	});

	it("create: ready no relanza la ingesta", async () => {
		const existing = {
			id: "doc-ready",
			status: "ready",
			extractionSource: "qr",
		};
		mockExisting(existing);

		const result = await service.create("user-1", { source: "share" }, upload);

		expect(result).toBe(existing);
		expect(ingestion.process).not.toHaveBeenCalled();
	});

	it("create: failed vuelve a pending, limpia la extracción y reprocesa", async () => {
		const existing = {
			id: "doc-failed",
			status: "failed",
			extractionSource: "ocr",
			issuerName: "Wong",
			totalAmount: "10.00",
		};
		mockExisting(existing);

		const reset = { ...existing, status: "pending", extractionSource: null, totalAmount: null };
		const set = vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([reset]),
			}),
		});
		db.update.mockReturnValue({ set });

		const result = await service.create("user-1", { source: "camera" }, upload);

		expect(result).toBe(reset);
		expect(storage.upload).not.toHaveBeenCalled();
		expect(posthog.capture).not.toHaveBeenCalled();
		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "pending",
				extractionSource: null,
				documentType: "unknown",
				issuerName: null,
				issuerTaxId: null,
				issueDate: null,
				documentNumber: null,
				currencyCode: null,
				totalAmount: null,
				igvAmount: null,
				wasUserCorrected: false,
			}),
		);
		await vi.waitFor(() => {
			expect(ingestion.process).toHaveBeenCalledWith(
				expect.objectContaining({ documentId: "doc-failed", userId: "user-1" }),
			);
		});
	});

	it("create: un insert nuevo emite document_created solo con source", async () => {
		db.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		});
		const inserted = { id: "doc-new", status: "pending", source: "gallery" };
		db.insert.mockReturnValue({
			values: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([inserted]),
			}),
		});

		const result = await service.create("user-1", { source: "gallery" }, upload);

		expect(result).toBe(inserted);
		expect(posthog.capture).toHaveBeenCalledWith({
			distinctId: "user-1",
			event: "document_created",
			properties: { source: "gallery" },
		});
	});

	it("softDelete: 404 si no hay fila visible", async () => {
		db.update.mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			}),
		});

		await expect(
			service.softDelete("user-1", "00000000-0000-4000-8000-000000000001"),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it("softDelete: marca deletedAt y borra el objeto", async () => {
		db.update.mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([{ id: "doc-1", objectKey: "users/user-1/a.jpg" }]),
				}),
			}),
		});

		await expect(service.softDelete("user-1", "doc-1")).resolves.toBeUndefined();
		expect(storage.delete).toHaveBeenCalledWith("users/user-1/a.jpg");
	});

	it("softDelete: si storage.delete falla, la fila sigue borrada y no relanza", async () => {
		db.update.mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([{ id: "doc-1", objectKey: "users/user-1/a.jpg" }]),
				}),
			}),
		});
		vi.mocked(storage.delete).mockRejectedValue(new Error("r2 down"));
		const errorLog = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

		await expect(service.softDelete("user-1", "doc-1")).resolves.toBeUndefined();
		expect(storage.delete).toHaveBeenCalledWith("users/user-1/a.jpg");
		expect(errorLog).toHaveBeenCalled();
		errorLog.mockRestore();
	});

	it("update persiste category y marca wasUserCorrected si cambia", async () => {
		const current = {
			id: "doc-1",
			status: "ready",
			documentType: "unknown",
			issuerName: null,
			issuerTaxId: null,
			issueDate: null,
			documentNumber: null,
			currencyCode: null,
			totalAmount: null,
			igvAmount: null,
			category: "otros",
		};
		db.select.mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue([current]),
			}),
		});
		const set = vi.fn().mockReturnValue({
			where: vi.fn().mockReturnValue({
				returning: vi.fn().mockResolvedValue([{ ...current, category: "restaurantes" }]),
			}),
		});
		db.update.mockReturnValue({ set });

		await service.update("user-1", "doc-1", { category: "restaurantes" });

		expect(set).toHaveBeenCalledWith(
			expect.objectContaining({
				category: "restaurantes",
				wasUserCorrected: true,
			}),
		);
	});

	it("summary incluye processingCount", async () => {
		const chain = (rows: unknown) => ({
			from: () => ({
				where: () => Promise.resolve(rows),
			}),
		});
		db.select
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([]))
			.mockReturnValueOnce(chain([{ count: 3 }]));

		const result = await service.summary("user-1", "2026-08");

		expect(result.processingCount).toBe(3);
	});

	describe("deductiblesByYear", () => {
		function mockSelectRows(
			rows: Array<{
				totalAmount: string | null;
				category: string;
				issueDate: string | null;
			}>,
		) {
			db.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(rows),
				}),
			});
		}

		it("empty year returns zeros and empty categories", async () => {
			mockSelectRows([]);

			const result = await service.deductiblesByYear("user-1", 2026);

			expect(result).toEqual({
				year: 2026,
				totalAmount: 0,
				documentCount: 0,
				categories: [],
				uit: 5500,
				topAmount: 16500,
				restaurantAmount: 0,
			});
		});

		it("excludes supermercado from totals", async () => {
			mockSelectRows([
				{ totalAmount: "100", category: "restaurantes", issueDate: "2026-06-01" },
				{ totalAmount: "999", category: "supermercado", issueDate: "2026-06-02" },
			]);

			const result = await service.deductiblesByYear("user-1", 2026);

			expect(result.totalAmount).toBe(100);
			expect(result.restaurantAmount).toBe(100);
			expect(result.topAmount).toBe(16500);
			expect(result.documentCount).toBe(1);
			expect(result.categories).toEqual([{ name: "Restaurantes", amount: 100 }]);
		});

		it("counts docs on Jan 1 and Dec 31", async () => {
			mockSelectRows([
				{ totalAmount: "50", category: "servicios_medicos", issueDate: "2026-01-01" },
				{ totalAmount: "75", category: "servicios_profesionales", issueDate: "2026-12-31" },
				{ totalAmount: "10", category: "supermercado", issueDate: "2026-01-01" },
			]);

			const result = await service.deductiblesByYear("user-1", 2026);

			expect(result.totalAmount).toBe(125);
			expect(result.restaurantAmount).toBe(0);
			expect(result.documentCount).toBe(2);
			expect(result.categories).toEqual(
				expect.arrayContaining([
					{ name: "Servicios médicos", amount: 50 },
					{ name: "Servicios profesionales", amount: 75 },
				]),
			);
			expect(result.categories).toHaveLength(2);
		});
	});
});

describe("UpdateDocumentSchema", () => {
	it("acepta category del mapa y rechaza un valor fuera de la lista", () => {
		const ok = v.safeParse(UpdateDocumentSchema, { category: "restaurantes" });
		expect(ok.success).toBe(true);
		if (ok.success) expect(ok.output.category).toBe("restaurantes");

		expect(v.safeParse(UpdateDocumentSchema, { category: "no-existe" }).success).toBe(false);
	});
});
