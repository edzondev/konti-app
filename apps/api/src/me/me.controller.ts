import { Controller, Delete, Get, HttpCode, Param, UseGuards } from "@nestjs/common";
import { AuthGuard, type AuthSession, type AuthUser } from "../auth/auth.guard.js";
import { CurrentSession } from "../auth/current-session.decorator.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionIdParamDto } from "./me.dto.js";
import { MeService } from "./me.service.js";

@UseGuards(AuthGuard)
@Controller("me")
export class MeController {
	constructor(private readonly meService: MeService) {}

	@Get("export")
	exportData(@CurrentUser() user: AuthUser) {
		return this.meService.exportData(user.id);
	}

	@Get("sessions")
	listSessions(@CurrentUser() user: AuthUser, @CurrentSession() session: AuthSession) {
		return this.meService.listSessions(user.id, session.id);
	}

	@Delete("sessions/:id")
	@HttpCode(204)
	revokeSession(
		@CurrentUser() user: AuthUser,
		@CurrentSession() session: AuthSession,
		@Param() params: SessionIdParamDto,
	) {
		return this.meService.revokeSession(user.id, session.id, params.id);
	}

	@Delete()
	@HttpCode(204)
	async deleteAccount(@CurrentUser() user: AuthUser): Promise<void> {
		await this.meService.deleteAccount(user.id);
	}
}
