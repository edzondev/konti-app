import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Inject,
	Param,
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
import { TaxPeriodService } from "./tax-period.service";
import {
	createTaxFilingSchema,
	createTaxPaymentSchema,
	createTaxPeriodReviewCommandSchema,
	createTaxSuspensionSchema,
	taxPeriodParamSchema,
	updateTaxPeriodSchema,
} from "./tax-period.validation";

@Controller("v1")
export class TaxPeriodController {
	constructor(
		private readonly service: TaxPeriodService,
		@Inject(AUTH) private readonly auth: Auth,
	) {}

	@Get("tax-periods/:period")
	async getPeriod(@Req() request: Request, @Param("period") period: string) {
		return this.service.getPeriod(
			await this.getUserId(request),
			this.parse(taxPeriodParamSchema, period),
		);
	}

	@Put("tax-periods/:period")
	async updatePeriod(
		@Req() request: Request,
		@Param("period") period: string,
		@Body() body: unknown,
	) {
		return this.service.updatePeriod(
			await this.getUserId(request),
			this.parse(taxPeriodParamSchema, period),
			this.parse(updateTaxPeriodSchema, body),
		);
	}

	@Post("tax-periods/:period/review")
	async reviewPeriod(
		@Req() request: Request,
		@Param("period") period: string,
		@Body() body: unknown,
	) {
		return this.service.reviewPeriod(
			await this.getUserId(request),
			this.parse(taxPeriodParamSchema, period),
			this.parse(createTaxPeriodReviewCommandSchema(), body),
		);
	}

	@Post("tax-suspensions")
	async recordSuspension(@Req() request: Request, @Body() body: unknown) {
		return this.service.recordSuspension(
			await this.getUserId(request),
			this.parse(createTaxSuspensionSchema, body),
		);
	}

	@Post("tax-filings")
	async recordFiling(@Req() request: Request, @Body() body: unknown) {
		return this.service.recordFiling(
			await this.getUserId(request),
			this.parse(createTaxFilingSchema(), body),
		);
	}

	@Post("tax-payments")
	async recordPayment(@Req() request: Request, @Body() body: unknown) {
		return this.service.recordPayment(
			await this.getUserId(request),
			this.parse(createTaxPaymentSchema(), body),
		);
	}

	private parse<Output>(schema: z.ZodType<Output>, value: unknown): Output {
		const result = schema.safeParse(value);
		if (!result.success) {
			throw new BadRequestException({
				message: "Los datos del periodo tributario no son válidos.",
				issues: result.error.issues,
			});
		}
		return result.data;
	}

	private async getUserId(request: Request): Promise<string> {
		const session = await this.auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
		if (!session) throw new UnauthorizedException();
		return session.user.id;
	}
}
