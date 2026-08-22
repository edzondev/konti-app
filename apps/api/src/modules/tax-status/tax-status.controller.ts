import { Controller, Get, Inject, Param, Req, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { TaxStatusService } from "./tax-status.service";

abstract class AuthenticatedTaxController {
	constructor(
		protected readonly taxStatusService: TaxStatusService,
		protected readonly auth: Auth,
	) {}

	protected async getUserId(request: Request): Promise<string> {
		const session = await this.auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});

		if (!session) throw new UnauthorizedException();
		return session.user.id;
	}
}

@Controller("v1/tax-status")
export class TaxStatusController extends AuthenticatedTaxController {
	constructor(
		@Inject(TaxStatusService) taxStatusService: TaxStatusService,
		@Inject(AUTH) auth: Auth,
	) {
		super(taxStatusService, auth);
	}

	@Get("current")
	async getCurrent(@Req() request: Request) {
		return this.taxStatusService.getCurrent(await this.getUserId(request));
	}
}

@Controller("v1/tax-evaluations")
export class TaxEvaluationsController extends AuthenticatedTaxController {
	constructor(
		@Inject(TaxStatusService) taxStatusService: TaxStatusService,
		@Inject(AUTH) auth: Auth,
	) {
		super(taxStatusService, auth);
	}

	@Get(":id")
	async getOne(@Req() request: Request, @Param("id") evaluationId: string) {
		return this.taxStatusService.getEvaluation(await this.getUserId(request), evaluationId);
	}
}
