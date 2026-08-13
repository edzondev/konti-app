import { Controller, Get, Inject, Req, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "./auth.constants";
import type { Auth } from "./auth.factory";

@Controller("v1")
export class AuthController {
	constructor(
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	@Get("me")
	async getMe(@Req() request: Request) {
		const session = await this.auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});

		if (!session) {
			throw new UnauthorizedException();
		}

		return {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image,
		};
	}
}
