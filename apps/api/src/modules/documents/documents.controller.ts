import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Inject,
	Param,
	Post,
	Query,
	Req,
	UnauthorizedException,
} from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AUTH } from "../../auth/auth.constants";
import type { Auth } from "../../auth/auth.factory";
import { createDevLogger } from "../../core/dev-logger";
import { decodeDocumentCursor } from "./documents.cursor";
import { DocumentsService } from "./documents.service";
import { createUploadSchema } from "./documents.validation";

const logger = createDevLogger("documents.controller");

@Controller("v1/documents")
export class DocumentsController {
	constructor(
		@Inject(DocumentsService)
		private readonly documentsService: DocumentsService,
		@Inject(AUTH)
		private readonly auth: Auth,
	) {}

	@Post("uploads")
	async createUpload(@Req() request: Request, @Body() body: unknown) {
		const userId = await this.getAuthenticatedUserId(request);
		const result = createUploadSchema.safeParse(body);

		if (!result.success) {
			logger.warn("createUpload:validation_failed", {
				userId,
				issues: result.error.issues.map((issue) => issue.path.join(".")),
			});
			throw new BadRequestException({
				message: "Los datos del comprobante no son válidos.",
				issues: result.error.issues,
			});
		}

		return this.documentsService.createUpload(userId, result.data);
	}

	@Post(":id/complete")
	async completeUpload(@Req() request: Request, @Param("id") id: string) {
		const userId = await this.getAuthenticatedUserId(request);
		return this.documentsService.completeUpload(userId, id);
	}

	@Get()
	async list(
		@Req() request: Request,
		@Query("cursor") cursor?: string,
		@Query("limit") limit?: string,
	) {
		const userId = await this.getAuthenticatedUserId(request);
		const parsedQuery = this.parseListQuery(cursor, limit);
		return this.documentsService.list(userId, parsedQuery);
	}

	@Get(":id")
	async getOne(@Req() request: Request, @Param("id") id: string) {
		const userId = await this.getAuthenticatedUserId(request);
		return this.documentsService.getOne(userId, id);
	}

	@Post(":id/file-url")
	async createFileUrl(@Req() request: Request, @Param("id") id: string) {
		const userId = await this.getAuthenticatedUserId(request);
		return this.documentsService.createFileUrl(userId, id);
	}

	private parseListQuery(cursor?: string, limit?: string) {
		if (cursor !== undefined) {
			try {
				decodeDocumentCursor(cursor);
			} catch {
				logger.warn("list:invalid_cursor");
				throw new BadRequestException({
					message: "El cursor de paginación no es válido.",
				});
			}
		}

		if (limit === undefined) {
			return { cursor, limit: undefined };
		}

		const parsedLimit = Number(limit);
		if (
			!Number.isFinite(parsedLimit) ||
			!Number.isInteger(parsedLimit) ||
			parsedLimit < 1 ||
			parsedLimit > 50
		) {
			logger.warn("list:invalid_limit", { limit });
			throw new BadRequestException({
				message: "El límite de paginación no es válido.",
			});
		}

		return { cursor, limit: parsedLimit };
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
