import { Controller, Delete, HttpCode, UseGuards } from "@nestjs/common";
import { AuthGuard, type AuthUser } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { MeService } from "./me.service.js";

@UseGuards(AuthGuard)
@Controller("me")
export class MeController {
	constructor(private readonly meService: MeService) {}

	@Delete()
	@HttpCode(204)
	async deleteAccount(@CurrentUser() user: AuthUser): Promise<void> {
		await this.meService.deleteAccount(user.id);
	}
}
