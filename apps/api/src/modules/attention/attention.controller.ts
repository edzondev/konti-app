import {
	BadRequestException,
	Controller,
	Get,
	Inject,
	Query,
	Req,
	UnauthorizedException,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { AttentionService } from "./attention.service";
import { openAttentionQuerySchema } from "./attention.validation";

@Controller("v1/attention-items")
export class AttentionController {
	constructor(
		@Inject(AttentionService)
		private readonly attentionService: AttentionService,
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	@Get()
	async listOpen(@Req() request: Request, @Query() query: unknown) {
		const session = await this.auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});
		if (!session) throw new UnauthorizedException();

		const parsed = openAttentionQuerySchema.safeParse(query);
		if (!parsed.success) {
			throw new BadRequestException({
				code: "ATTENTION_QUERY_INVALID",
				message: "Los filtros de atención no son válidos.",
			});
		}
		return this.attentionService.getOpenForUser(session.user.id, 2026, parsed.data.limit);
	}
}
