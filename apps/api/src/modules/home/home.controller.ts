import { Controller, Get, Inject, Req, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { HomeService } from "./home.service";

@Controller("v1/home")
export class HomeController {
	constructor(
		@Inject(HomeService)
		private readonly homeService: HomeService,
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	@Get()
	async getCurrent(@Req() request: Request) {
		const session = await this.auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});

		if (!session) {
			throw new UnauthorizedException();
		}

		return this.homeService.getCurrentHome(session.user.id);
	}
}
