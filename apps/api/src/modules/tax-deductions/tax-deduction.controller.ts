import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	Patch,
	Post,
	Put,
	Req,
	UnauthorizedException,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { z } from "zod";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { TaxDeductionService } from "./tax-deduction.service";
import {
	createTaxDeductionSchema,
	documentTaxDeductionDecisionSchema,
	updateTaxDeductionSchema,
} from "./tax-deduction.validation";

@Controller("v1/tax-deductions")
export class TaxDeductionController {
	constructor(
		private readonly service: TaxDeductionService,
		@Inject(AUTH) private readonly auth: Auth,
	) {}

	@Get()
	async list(@Req() request: Request) {
		return this.service.list(await this.getUserId(request));
	}

	@Post()
	async create(@Req() request: Request, @Body() body: unknown) {
		return this.service.createManual(
			await this.getUserId(request),
			this.parse(createTaxDeductionSchema(), body),
		);
	}

	@Post("document-decision")
	async decideDocument(@Req() request: Request, @Body() body: unknown) {
		return this.service.decideDocument(
			await this.getUserId(request),
			this.parse(documentTaxDeductionDecisionSchema(), body),
		);
	}

	@Put("identity")
	async storeIdentity(@Req() request: Request, @Body() body: unknown) {
		const input = this.parse(z.object({ dni: z.string().regex(/^\d{8}$/) }).strict(), body);
		return this.service.storeIdentity(await this.getUserId(request), input.dni);
	}

	@Get(":id")
	async getOne(@Req() request: Request, @Param("id") id: string) {
		return this.service.getOne(await this.getUserId(request), id);
	}

	@Patch(":id")
	async update(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
		return this.service.update(
			await this.getUserId(request),
			id,
			this.parse(updateTaxDeductionSchema(), body),
		);
	}

	@Delete(":id")
	async remove(@Req() request: Request, @Param("id") id: string) {
		return this.service.remove(await this.getUserId(request), id);
	}

	private parse<Output>(schema: z.ZodType<Output>, body: unknown): Output {
		const result = schema.safeParse(body);
		if (!result.success) {
			throw new BadRequestException({
				message: "Los datos de la deducción no son válidos.",
				issues: result.error.issues,
			});
		}
		return result.data;
	}

	private async getUserId(request: Request) {
		const session = await this.auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
		if (!session) throw new UnauthorizedException();
		return session.user.id;
	}
}
