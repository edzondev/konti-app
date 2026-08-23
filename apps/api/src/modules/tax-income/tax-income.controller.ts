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
	Query,
	Req,
	UnauthorizedException,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { TaxIncomeService } from "./tax-income.service";
import {
	createDocumentDecisionSchema,
	createEmploymentCoverageResolutionSchema,
	createTaxIncomeSchema,
	updateTaxIncomeSchema,
} from "./tax-income.validation";

@Controller("v1/tax-income-records")
export class TaxIncomeController {
	constructor(
		@Inject(TaxIncomeService)
		private readonly taxIncomeService: TaxIncomeService,
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	@Get()
	async list(
		@Req() request: Request,
		@Query("year") year?: string,
		@Query("cursor") cursor?: string,
		@Query("limit") limit?: string,
		@Query("type") type?: string,
	) {
		const parsedYear = year === undefined ? 2026 : Number(year);
		const parsedLimit = limit === undefined ? undefined : Number(limit);
		if (
			!Number.isInteger(parsedYear) ||
			(parsedLimit !== undefined &&
				(!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50))
		) {
			throw new BadRequestException({ message: "La paginación no es válida." });
		}
		if (type !== undefined && type !== "all" && type !== "employment" && type !== "fourth") {
			throw new BadRequestException({ message: "El filtro de ingresos no es válido." });
		}

		return this.taxIncomeService.list(await this.getUserId(request), {
			year: parsedYear,
			cursor,
			limit: parsedLimit,
			type: type as "all" | "employment" | "fourth" | undefined,
		});
	}

	@Post()
	async create(@Req() request: Request, @Body() body: unknown) {
		const input = this.parse(createTaxIncomeSchema(), body);
		return this.taxIncomeService.createManual(await this.getUserId(request), input);
	}

	@Post("document-decision")
	async decideDocument(@Req() request: Request, @Body() body: unknown) {
		const input = this.parse(createDocumentDecisionSchema(), body);
		return this.taxIncomeService.decideDocument(await this.getUserId(request), input);
	}

	@Post(":id/coverage-resolution")
	async resolveEmploymentCoverage(
		@Req() request: Request,
		@Param("id") id: string,
		@Body() body: unknown,
	) {
		const input = this.parse(createEmploymentCoverageResolutionSchema(), body);
		return this.taxIncomeService.resolveEmploymentCoverageConflict(
			await this.getUserId(request),
			id,
			input,
		);
	}

	@Get(":id")
	async getOne(@Req() request: Request, @Param("id") id: string) {
		return this.taxIncomeService.getOne(await this.getUserId(request), id);
	}

	@Patch(":id")
	async update(@Req() request: Request, @Param("id") id: string, @Body() body: unknown) {
		const input = this.parse(updateTaxIncomeSchema(), body);
		return this.taxIncomeService.update(await this.getUserId(request), id, input);
	}

	@Delete(":id")
	async remove(@Req() request: Request, @Param("id") id: string) {
		return this.taxIncomeService.remove(await this.getUserId(request), id);
	}

	private parse<Output>(
		schema: {
			safeParse(
				value: unknown,
			): { success: true; data: Output } | { success: false; error: { issues: unknown[] } };
		},
		body: unknown,
	): Output {
		const result = schema.safeParse(body);
		if (!result.success) {
			throw new BadRequestException({
				message: "Los datos del ingreso no son válidos.",
				issues: result.error.issues,
			});
		}
		return result.data;
	}

	private async getUserId(request: Request) {
		const session = await this.auth.api.getSession({
			headers: fromNodeHeaders(request.headers),
		});
		if (!session) throw new UnauthorizedException();
		return session.user.id;
	}
}
