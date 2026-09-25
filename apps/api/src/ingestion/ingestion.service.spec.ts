import type { ConfigService } from "@nestjs/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../config/env.js";
import { IngestionService } from "./ingestion.service.js";
import { OcrClient } from "./ocr-client.js";

describe("IngestionService", () => {
	const ocr = {
		extract: vi.fn(),
	} as unknown as OcrClient;

	const config = {
		get: vi.fn().mockReturnValue(100),
	} as unknown as ConfigService<Env, true>;

	let db: {
		update: ReturnType<typeof vi.fn>;
		select: ReturnType<typeof vi.fn>;
	};
	let setMock: ReturnType<typeof vi.fn>;
	let whereMock: ReturnType<typeof vi.fn>;
	let service: IngestionService;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(config.get).mockReturnValue(100);
		whereMock = vi.fn().mockReturnValue({
			returning: vi.fn().mockResolvedValue([{ id: "doc-1" }]),
		});
		setMock = vi.fn().mockReturnValue({ where: whereMock });
		db = {
			update: vi.fn().mockReturnValue({ set: setMock }),
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						orderBy: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([]),
						}),
						// OCR budget path: where() resolves to rows with count
						then: undefined,
					}),
				}),
			}),
		};

		// Dual path: budget count vs category lookup
		const whereFn = vi.fn().mockImplementation(() => {
			const chain = {
				orderBy: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			};
			// Thenable for `await select...where()` (OCR budget)
			Object.assign(chain, {
				then: (resolve: (v: unknown) => unknown) => Promise.resolve([{ count: 0 }]).then(resolve),
			});
			return chain;
		});
		db.select = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({ where: whereFn }),
		});

		service = new IngestionService(db as never, ocr, config);
	});

	it("guarda extractionSource=qr cuando el QR parsea", async () => {
		await service.process({
			documentId: "doc-1",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "20543722309|03|BC35|00105975|111.35|2026-08-21",
		});

		expect(ocr.extract).not.toHaveBeenCalled();
		const setArg = setMock.mock.calls[0]?.[0] as {
			status: string;
			extractionSource: string;
			category: string;
		};
		expect(setArg.status).toBe("ready");
		expect(setArg.extractionSource).toBe("qr");
		expect(setArg.category).toBe("otros");
	});

	it("guarda extractionSource=local cuando localText parsea", async () => {
		await service.process({
			documentId: "doc-local",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			localText: "RUC 20543722309 Fecha 21/08/2026 Total 50.00",
		});

		expect(ocr.extract).not.toHaveBeenCalled();
		const setArg = setMock.mock.calls[0]?.[0] as {
			extractionSource: string;
			totalAmount: string;
			category: string;
		};
		expect(setArg.extractionSource).toBe("local");
		expect(setArg.totalAmount).toBe("50.00");
		expect(setArg.category).toBe("otros");
	});

	it("trata un qrPayload que no es SUNAT pero sí texto local como source local y no llama OCR", async () => {
		vi.mocked(ocr.extract).mockResolvedValue({
			documentType: "unknown",
			issuerName: null,
			issuerTaxId: null,
			issueDate: null,
			documentNumber: null,
			currencyCode: "PEN",
			totalAmount: "1.00",
			igvAmount: null,
		});

		await service.process({
			documentId: "doc-qr-local",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "RUC 20543722309 Fecha 21/08/2026 Total 50.00",
		});

		expect(ocr.extract).not.toHaveBeenCalled();
		const setArg = setMock.mock.calls[0]?.[0] as {
			extractionSource: string;
			totalAmount: string;
		};
		expect(setArg.extractionSource).toBe("local");
		expect(setArg.totalAmount).toBe("50.00");
	});

	it("categoriza por issuerName conocido del mismo RUC", async () => {
		const whereFn = vi.fn().mockReturnValue({
			orderBy: vi.fn().mockReturnValue({
				limit: vi.fn().mockResolvedValue([{ issuerName: "Wong" }]),
			}),
		});
		db.select = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({ where: whereFn }),
		});

		await service.process({
			documentId: "doc-learn",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "20543722309|03|BC35|00105975|111.35|2026-08-21",
		});

		const setArg = setMock.mock.calls[0]?.[0] as { category: string };
		expect(setArg.category).toBe("supermercado");
	});

	it("guarda extractionSource=ocr cuando el QR es basura y hay cupo", async () => {
		vi.mocked(ocr.extract).mockResolvedValue({
			documentType: "unknown",
			issuerName: null,
			issuerTaxId: null,
			issueDate: null,
			documentNumber: null,
			currencyCode: "PEN",
			totalAmount: null,
			igvAmount: null,
		});

		await service.process({
			documentId: "doc-2",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "basura",
		});

		expect(ocr.extract).toHaveBeenCalledOnce();
		const setArg = setMock.mock.calls[0]?.[0] as {
			status: string;
			extractionSource: string;
			category: string;
		};
		expect(setArg.status).toBe("failed");
		expect(setArg.extractionSource).toBe("ocr");
		expect(setArg.category).toBe("otros");
	});

	it("degrada a manual sin llamar Mistral cuando no hay cupo OCR", async () => {
		vi.mocked(config.get).mockReturnValue(0);

		await service.process({
			documentId: "doc-manual",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
		});

		expect(ocr.extract).not.toHaveBeenCalled();
		const setArg = setMock.mock.calls[0]?.[0] as {
			status: string;
			extractionSource: string;
			totalAmount: string | null;
		};
		expect(setArg.status).toBe("pending");
		expect(setArg.extractionSource).toBe("manual");
		expect(setArg.totalAmount).toBeNull();
	});

	it("no aplica update si el documento ya no está pending", async () => {
		whereMock.mockReturnValue({
			returning: vi.fn().mockResolvedValue([]),
		});

		await service.process({
			documentId: "doc-skip",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "20543722309|03|BC35|00105975|111.35|2026-08-21",
		});

		expect(ocr.extract).not.toHaveBeenCalled();
	});
});
