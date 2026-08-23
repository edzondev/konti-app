import { Controller, Get, Inject, Req, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { HomeService } from "./home.service";
import { HomeCurrentService } from "./home-current.service";

@Controller("v1/home")
export class HomeController {
	constructor(
		@Inject(HomeService)
		private readonly homeService: HomeService,
		@Inject(HomeCurrentService)
		private readonly homeCurrentService: HomeCurrentService,
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	@Get("current")
	async getCurrent(@Req() request: Request) {
		const userId = await this.authenticatedUserId(request);
		return this.homeCurrentService.getCurrentHome(userId);
	}

	@Get()
	async getLegacy(@Req() request: Request) {
		const userId = await this.authenticatedUserId(request);
		return this.homeService.getCurrentHome(userId);
	}

	private async authenticatedUserId(request: Request): Promise<string> {
		const session = await this.auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});

		if (!session) {
			throw new UnauthorizedException();
		}

		return session.user.id;
	}
}
