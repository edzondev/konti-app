jest.mock("better-auth/node", () => ({ fromNodeHeaders: jest.fn(() => new Headers()) }));

import { UnauthorizedException } from "@nestjs/common";
import type { Auth } from "../../auth/auth.factory";
import { HomeController } from "./home.controller";
import type { HomeService } from "./home.service";
import type { HomeCurrentService } from "./home-current.service";

describe("HomeController", () => {
	const legacy = { getCurrentHome: jest.fn() };
	const current = { getCurrentHome: jest.fn() };
	const auth = { api: { getSession: jest.fn() } };
	const controller = new HomeController(
		legacy as unknown as HomeService,
		current as unknown as HomeCurrentService,
		auth as unknown as Auth,
	);
	const request = { headers: {} } as never;

	beforeEach(() => jest.clearAllMocks());

	it("serves the 4.7 current read model for the authenticated owner", async () => {
		auth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
		current.getCurrentHome.mockResolvedValue({ status: "calculated" });

		await expect(controller.getCurrent(request)).resolves.toEqual({ status: "calculated" });
		expect(current.getCurrentHome).toHaveBeenCalledWith("user-1");
		expect(legacy.getCurrentHome).not.toHaveBeenCalled();
	});

	it("preserves the legacy handler separately", async () => {
		auth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
		legacy.getCurrentHome.mockResolvedValue({ status: "starting" });

		await expect(controller.getLegacy(request)).resolves.toEqual({ status: "starting" });
		expect(legacy.getCurrentHome).toHaveBeenCalledWith("user-1");
	});

	it("rejects anonymous current requests", async () => {
		auth.api.getSession.mockResolvedValue(null);

		await expect(controller.getCurrent(request)).rejects.toBeInstanceOf(UnauthorizedException);
		expect(current.getCurrentHome).not.toHaveBeenCalled();
	});
});
