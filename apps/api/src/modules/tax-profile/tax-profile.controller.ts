import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Inject,
	Put,
	Req,
	UnauthorizedException,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { TaxProfileService } from "./tax-profile.service";
import { updateTaxProfileSchema } from "./tax-profile.validation";

@Controller("v1/tax-profile")
export class TaxProfileController {
	constructor(
		@Inject(TaxProfileService)
		private readonly taxProfileService: TaxProfileService,
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	@Get("current")
	async getCurrent(@Req() request: Request) {
		const userId = await this.getAuthenticatedUserId(request);

		return this.taxProfileService.getCurrentUser(userId);
	}

	@Put("current")
	async updateCurrent(@Req() request: Request, @Body() body: unknown) {
		const userId = await this.getAuthenticatedUserId(request);

		const result = updateTaxProfileSchema.safeParse(body);

		if (!result.success) {
			throw new BadRequestException({
				message: "Los datos del perfil tributario no son válidos.",
				issues: result.error.issues,
			});
		}

		return this.taxProfileService.upsertCurrent(userId, result.data);
	}

	private async getAuthenticatedUserId(request: Request) {
		const session = await this.auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});

		if (!session) {
			throw new UnauthorizedException();
		}

		return session.user.id;
	}
}
