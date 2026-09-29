import type { ConfigService } from "@nestjs/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../config/env.js";
import { FieldJudge } from "./field-judge.js";
import { IngestionService, shouldSoftDeleteDuplicate } from "./ingestion.service.js";
import { OcrClient } from "./ocr-client.js";

describe("shouldSoftDeleteDuplicate", () => {
	const older = new Date("2026-08-01T12:00:00.000Z");
	const current = new Date("2026-08-21T12:00:00.000Z");

	it("borra el actual si otro vivo tiene createdAt anterior", () => {
		expect(
			shouldSoftDeleteDuplicate("doc-current", [
				{ id: "doc-older", createdAt: older },
				{ id: "doc-current", createdAt: current },
			]),
		).toBe(true);
	});

	it("borra el actual si el otro tiene el mismo createdAt", () => {
		expect(
			shouldSoftDeleteDuplicate("doc-current", [
				{ id: "doc-tie", createdAt: current },
				{ id: "doc-current", createdAt: current },
			]),
		).toBe(true);
	});

	it("conserva el actual cuando es el más antiguo", () => {
		expect(
			shouldSoftDeleteDuplicate("doc-older", [
				{ id: "doc-older", createdAt: older },
				{ id: "doc-current", createdAt: current },
			]),
		).toBe(false);
	});

	it("no borra si no hay otro comprobante", () => {
		expect(shouldSoftDeleteDuplicate("doc-current", [{ id: "doc-current", createdAt: current }])).toBe(
			false,
		);
		expect(shouldSoftDeleteDuplicate("doc-current", [])).toBe(false);
	});
});

describe("IngestionService", () => {
	const ocr = {
		extract: vi.fn(),
	} as unknown as OcrClient;

	const fields = {
		pick: vi.fn(),
	} as unknown as FieldJudge;

	const readyPick = {
		confident: true,
		extracted: {
			documentType: "boleta" as const,
			issuerName: "COMERCIO SAC",
			issuerTaxId: "20543722309",
			issueDate: "2026-08-21",
			documentNumber: null,
			currencyCode: "PEN",
			totalAmount: "50.00",
			igvAmount: null,
		},
	};

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
			select: vi.fn(),
		};

		// `await where()` cuenta el cupo; `.orderBy().limit()` busca el emisor.
		const whereFn = vi.fn().mockImplementation(() =>
			Object.assign(Promise.resolve([{ count: 0 }]), {
				orderBy: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue([]),
				}),
			}),
		);
		db.select = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({ where: whereFn }),
		});

		service = new IngestionService(db as never, ocr, fields, config);
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

	it("un QR que no es SUNAT sigue a OCR y no queda como local", async () => {
		vi.mocked(ocr.extract).mockResolvedValue("TOTAL 50.00");
		vi.mocked(fields.pick).mockResolvedValue(readyPick);

		await service.process({
			documentId: "doc-qr-local",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "https://drive.google.com/file/d/abc",
		});

		expect(ocr.extract).toHaveBeenCalledOnce();
		const setArg = setMock.mock.calls[0]?.[0] as {
			extractionSource: string;
			totalAmount: string;
		};
		expect(setArg.extractionSource).toBe("ocr");
		expect(setArg.totalAmount).toBe("50.00");
	});

	it("categoriza por issuerName conocido del mismo RUC", async () => {
		let call = 0;
		const whereFn = vi.fn().mockImplementation(() => {
			call += 1;
			const rows = call === 1 ? [{ issuerName: "Wong" }] : [];
			return {
				orderBy: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(rows),
				}),
			};
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

	it("guarda extractionSource=ocr cuando Jev confirma el total", async () => {
		vi.mocked(ocr.extract).mockResolvedValue("TOTAL 50.00");
		vi.mocked(fields.pick).mockResolvedValue(readyPick);

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
		expect(setArg.status).toBe("ready");
		expect(setArg.extractionSource).toBe("ocr");
		expect(setArg.category).toBe("otros");
	});

	it("degrada a pending vía ocr si Jev no está seguro del total", async () => {
		vi.mocked(ocr.extract).mockResolvedValue("foto borrosa");
		vi.mocked(fields.pick).mockResolvedValue({
			confident: false,
			extracted: {
				...readyPick.extracted,
				totalAmount: null,
				issuerName: "COMERCIO SAC",
				issueDate: "2026-08-21",
			},
		});

		await service.process({
			documentId: "doc-unsure",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
		});

		const setArg = setMock.mock.calls[0]?.[0] as {
			status: string;
			extractionSource: string;
			totalAmount: string | null;
			issuerName: string | null;
			issueDate: string | null;
		};
		expect(setArg.status).toBe("pending");
		expect(setArg.extractionSource).toBe("ocr");
		expect(setArg.totalAmount).toBeNull();
		expect(setArg.issuerName).toBe("COMERCIO SAC");
		expect(setArg.issueDate).toBe("2026-08-21");
	});

	it("degrada a pending vía ocr si TypeSafe falla tras Mistral", async () => {
		vi.mocked(ocr.extract).mockResolvedValue("TOTAL 50.00");
		vi.mocked(fields.pick).mockRejectedValue(new Error("TypeSafe timed out after 30000ms"));

		await service.process({
			documentId: "doc-typesafe-down",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
		});

		const setArg = setMock.mock.calls[0]?.[0] as {
			status: string;
			extractionSource: string;
			totalAmount: string | null;
		};
		expect(setArg.status).toBe("pending");
		expect(setArg.extractionSource).toBe("ocr");
		expect(setArg.totalAmount).toBeNull();
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

	it("soft-delete el doc actual si ya hay un comprobante vivo más antiguo con el mismo RUC y número", async () => {
		const older = new Date("2026-08-01T12:00:00.000Z");
		const current = new Date("2026-08-21T12:00:00.000Z");
		let call = 0;
		const whereFn = vi.fn().mockImplementation(() => {
			call += 1;
			const rows =
				call === 1
					? []
					: [
							{ id: "doc-older", createdAt: older },
							{ id: "doc-current", createdAt: current },
						];
			return {
				orderBy: vi.fn().mockReturnValue({
					limit: vi.fn().mockResolvedValue(rows),
				}),
			};
		});
		db.select = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({ where: whereFn }),
		});

		await service.process({
			documentId: "doc-current",
			userId: "user-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "20543722309|03|BC35|00105975|111.35|2026-08-21",
		});

		const setArg = setMock.mock.calls[0]?.[0] as {
			status: string;
			deletedAt?: Date;
		};
		expect(setArg.deletedAt).toBeInstanceOf(Date);
		expect(setArg.status).not.toBe("ready");
	});
});
