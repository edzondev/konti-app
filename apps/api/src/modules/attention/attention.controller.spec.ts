jest.mock("better-auth/node", () => ({ fromNodeHeaders: jest.fn(() => new Headers()) }));

import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import type { Auth } from "../../auth/auth.factory";
import { AttentionController } from "./attention.controller";
import type { AttentionService } from "./attention.service";

describe("AttentionController", () => {
	const attentionService = { getOpenForUser: jest.fn() };
	const auth = { api: { getSession: jest.fn() } };
	const controller = new AttentionController(
		attentionService as unknown as AttentionService,
		auth as unknown as Auth,
	);
	const request = { headers: {} } as never;

	beforeEach(() => jest.clearAllMocks());

	it("scopes open attention to the authenticated user and the supported year", async () => {
		auth.api.getSession.mockResolvedValue({ user: { id: "owner-1" } });
		attentionService.getOpenForUser.mockResolvedValue({ count: 0, items: [], nextItem: null });

		await controller.listOpen(request, { status: "open", limit: "10" });

		expect(attentionService.getOpenForUser).toHaveBeenCalledWith("owner-1", 2026, 10);
	});

	it("rejects unsupported or unbounded filters", async () => {
		auth.api.getSession.mockResolvedValue({ user: { id: "owner-1" } });

		await expect(
			controller.listOpen(request, { status: "resolved", limit: 100 }),
		).rejects.toBeInstanceOf(BadRequestException);
		expect(attentionService.getOpenForUser).not.toHaveBeenCalled();
	});

	it("does not expose attention without a session", async () => {
		auth.api.getSession.mockResolvedValue(null);

		await expect(controller.listOpen(request, {})).rejects.toBeInstanceOf(UnauthorizedException);
	});
});
