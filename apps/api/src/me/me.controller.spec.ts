import { BadRequestException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as v from "valibot";
import type { AuthSession, AuthUser } from "../auth/auth.guard.js";
import { SessionIdParamSchema } from "./me.dto.js";
import { MeController } from "./me.controller.js";
import type { MeService } from "./me.service.js";

describe("MeController perfil endpoints", () => {
	const user = { id: "user-1" } as AuthUser;
	const currentSession = { id: "sess-current" } as AuthSession;

	const meService = {
		exportData: vi.fn(),
		listSessions: vi.fn(),
		revokeSession: vi.fn(),
		deleteAccount: vi.fn(),
	};

	const controller = new MeController(meService as unknown as MeService);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("export delega y no incluye objectKey", async () => {
		const payload = {
			exportedAt: "2026-09-23T00:00:00.000Z",
			user: { id: "user-1", name: "Ada", email: "ada@example.com", createdAt: "2026-01-01T00:00:00.000Z" },
			documents: [
				{
					id: "doc-1",
					status: "ready",
					source: "camera",
					mimeType: "image/jpeg",
					sizeBytes: 1,
					sha256: "abc",
					documentType: "boleta",
					issuerName: null,
					issuerTaxId: null,
					issueDate: null,
					documentNumber: null,
					currencyCode: null,
					totalAmount: null,
					igvAmount: null,
					extractionSource: null,
					wasUserCorrected: false,
					category: "otros",
					createdAt: "2026-03-01T00:00:00.000Z",
					updatedAt: "2026-03-01T00:00:00.000Z",
				},
			],
		};
		meService.exportData.mockResolvedValue(payload);

		const result = await controller.exportData(user);

		expect(meService.exportData).toHaveBeenCalledWith("user-1");
		expect(result).toEqual(payload);
		expect(JSON.stringify(result)).not.toContain("objectKey");
	});

	it("listSessions delega con id de sesión actual", async () => {
		meService.listSessions.mockResolvedValue([]);

		await controller.listSessions(user, currentSession);

		expect(meService.listSessions).toHaveBeenCalledWith("user-1", "sess-current");
	});

	it("revoke otra sesión → resuelve", async () => {
		meService.revokeSession.mockResolvedValue(undefined);

		await expect(
			controller.revokeSession(user, currentSession, { id: "sess-other" }),
		).resolves.toBeUndefined();
		expect(meService.revokeSession).toHaveBeenCalledWith(
			"user-1",
			"sess-current",
			"sess-other",
		);
	});

	it("revoke sesión actual → BadRequestException", async () => {
		meService.revokeSession.mockRejectedValue(new BadRequestException());

		await expect(
			controller.revokeSession(user, currentSession, { id: "sess-current" }),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it("revoke sesión inexistente → NotFoundException", async () => {
		meService.revokeSession.mockRejectedValue(new NotFoundException());

		await expect(
			controller.revokeSession(user, currentSession, { id: "sess-missing" }),
		).rejects.toBeInstanceOf(NotFoundException);
	});

	it("SessionIdParamSchema rechaza id vacío", () => {
		const result = v.safeParse(SessionIdParamSchema, { id: "" });
		expect(result.success).toBe(false);
	});
});
