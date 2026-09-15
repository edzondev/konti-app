import { beforeEach, describe, expect, it, vi } from "vitest";
import { IngestionService } from "./ingestion.service.js";
import { OcrClient } from "./ocr-client.js";

describe("IngestionService", () => {
	const ocr = {
		extract: vi.fn(),
	} as unknown as OcrClient;

	let db: { update: ReturnType<typeof vi.fn> };
	let service: IngestionService;

	beforeEach(() => {
		vi.clearAllMocks();
		db = {
			update: vi.fn().mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue(undefined),
				}),
			}),
		};
		service = new IngestionService(db as never, ocr);
	});

	it("guarda extractionSource=qr cuando el QR parsea", async () => {
		await service.process({
			documentId: "doc-1",
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "20543722309|03|BC35|00105975|111.35|2026-08-21",
		});

		expect(ocr.extract).not.toHaveBeenCalled();
		const setArg = db.update.mock.results[0]?.value.set.mock.calls[0]?.[0] as {
			extractionSource: string;
		};
		expect(setArg.extractionSource).toBe("qr");
	});

	it("guarda extractionSource=ocr cuando el QR es basura", async () => {
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
			buffer: Buffer.from("x"),
			mimeType: "image/jpeg",
			qrPayload: "basura",
		});

		expect(ocr.extract).toHaveBeenCalledOnce();
		const setArg = db.update.mock.results[0]?.value.set.mock.calls[0]?.[0] as {
			extractionSource: string;
		};
		expect(setArg.extractionSource).toBe("ocr");
	});
});
