import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostHog } from "posthog-node";
import { StorageService } from "../storage/storage.service.js";
import { MeService } from "./me.service.js";

describe("MeService", () => {
	const storage = {
		delete: vi.fn(),
	} as unknown as StorageService;

	const posthog = {
		capture: vi.fn(),
		flush: vi.fn().mockResolvedValue(undefined),
	} as unknown as PostHog;

	let db: {
		select: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};
	let service: MeService;

	beforeEach(() => {
		vi.clearAllMocks();
		db = {
			select: vi.fn(),
			delete: vi.fn(),
		};
		service = new MeService(db as never, storage, posthog);
	});

	describe("exportData", () => {
		it("omite objectKey en cada documento", async () => {
			const userRow = {
				id: "user-1",
				name: "Ada",
				email: "ada@example.com",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			};
			const docRow = {
				id: "doc-1",
				status: "ready",
				source: "camera",
				mimeType: "image/jpeg",
				sizeBytes: 100,
				sha256: "abc",
				documentType: "boleta",
				issuerName: "Tienda",
				issuerTaxId: "20123456789",
				issueDate: "2026-03-01",
				documentNumber: "B001-1",
				currencyCode: "PEN",
				totalAmount: "10.00",
				igvAmount: "1.80",
				extractionSource: "ocr",
				wasUserCorrected: false,
				category: "otros",
				createdAt: new Date("2026-03-01T12:00:00.000Z"),
				updatedAt: new Date("2026-03-01T12:00:00.000Z"),
				objectKey: "users/user-1/documents/secret.jpg",
			};

			db.select
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([userRow]),
						}),
					}),
				})
				.mockReturnValueOnce({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockResolvedValue([docRow]),
					}),
				});

			const result = await service.exportData("user-1");

			expect(result.user).toEqual({
				id: "user-1",
				name: "Ada",
				email: "ada@example.com",
				createdAt: "2026-01-01T00:00:00.000Z",
			});
			expect(result.documents).toHaveLength(1);
			expect(result.documents[0]).not.toHaveProperty("objectKey");
			expect(JSON.stringify(result)).not.toContain("objectKey");
			expect(JSON.stringify(result)).not.toContain("secret.jpg");
		});
	});

	describe("listSessions", () => {
		it("marca isCurrent y enmascara IP", async () => {
			db.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockResolvedValue([
						{
							id: "sess-current",
							createdAt: new Date("2026-01-01T00:00:00.000Z"),
							expiresAt: new Date("2026-02-01T00:00:00.000Z"),
							ipAddress: "203.0.113.42",
							userAgent:
								"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
						},
						{
							id: "sess-other",
							createdAt: new Date("2026-01-02T00:00:00.000Z"),
							expiresAt: new Date("2026-02-02T00:00:00.000Z"),
							ipAddress: "198.51.100.10",
							userAgent: null,
						},
					]),
				}),
			});

			const sessions = await service.listSessions("user-1", "sess-current");

			expect(sessions).toHaveLength(2);
			expect(sessions[0]).toMatchObject({
				id: "sess-current",
				ipMasked: "203.0.xxx.xxx",
				isCurrent: true,
			});
			expect(sessions[0]!.label.toLowerCase()).toMatch(/chrome|android/);
			expect(sessions[1]).toMatchObject({
				id: "sess-other",
				ipMasked: "198.51.xxx.xxx",
				label: "Dispositivo desconocido",
				isCurrent: false,
			});
		});
	});

	describe("revokeSession", () => {
		it("sesión actual → BadRequestException", async () => {
			await expect(
				service.revokeSession("user-1", "sess-1", "sess-1"),
			).rejects.toBeInstanceOf(BadRequestException);
			expect(db.delete).not.toHaveBeenCalled();
		});

		it("sesión inexistente → NotFoundException", async () => {
			db.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			});

			await expect(
				service.revokeSession("user-1", "sess-current", "sess-missing"),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it("otra sesión → elimina y resuelve", async () => {
			db.delete.mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([{ id: "sess-other" }]),
				}),
			});

			await expect(
				service.revokeSession("user-1", "sess-current", "sess-other"),
			).resolves.toBeUndefined();
		});
	});
});
