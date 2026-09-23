import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Header,
	HttpCode,
	Logger,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Patch,
	Post,
	Query,
	StreamableFile,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import * as v from "valibot";
import { AuthGuard, type AuthUser } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { DocumentMimeTypeSchema } from "../storage/mime.js";
import {
	CreateDocumentDto,
	DeductiblesYearQueryDto,
	DocumentIdParamDto,
	ListDocumentsQueryDto,
	UpdateDocumentDto,
} from "./documents.dto.js";
import { DocumentsService } from "./documents.service.js";
import { DocumentsRateLimitGuard } from "./documents-rate-limit.guard.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@UseGuards(AuthGuard)
@Controller("documents")
export class DocumentsController {
	private readonly logger = new Logger(DocumentsController.name);

	constructor(private readonly documentsService: DocumentsService) {}

	@Post()
	@UseGuards(DocumentsRateLimitGuard)
	@UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
	async create(
		@CurrentUser() user: AuthUser,
		@Body() dto: CreateDocumentDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })],
			}),
		)
		file: Express.Multer.File,
	) {
		this.logger.log(
			`create user=${user.id} source=${dto.source} mime=${file.mimetype} bytes=${file.size} qr=${dto.qrPayload ? "yes" : "no"}`,
		);

		const mimeType = v.safeParse(DocumentMimeTypeSchema, file.mimetype);
		if (!mimeType.success) {
			throw new BadRequestException("Tipo de archivo no permitido");
		}

		return this.documentsService.create(user.id, dto, {
			buffer: file.buffer,
			size: file.size,
			mimeType: mimeType.output,
		});
	}

	@Get()
	async list(@CurrentUser() user: AuthUser, @Query() query: ListDocumentsQueryDto) {
		return this.documentsService.list(user.id, query.month);
	}

	@Get("summary")
	async summary(@CurrentUser() user: AuthUser, @Query() query: ListDocumentsQueryDto) {
		return this.documentsService.summary(user.id, query.month);
	}

	// Antes de @Get(':id') para que "deductibles" no se interprete como UUID.
	@Get("deductibles/year")
	async deductiblesByYear(
		@CurrentUser() user: AuthUser,
		@Query() query: DeductiblesYearQueryDto,
	) {
		return this.documentsService.deductiblesByYear(user.id, query.year);
	}

	// Antes de @Get(':id') para que "image" no se interprete como UUID.
	@Get(":id/image")
	@Header("Cache-Control", "private, max-age=300")
	async getImage(
		@CurrentUser() user: AuthUser,
		@Param() params: DocumentIdParamDto,
	): Promise<StreamableFile> {
		const { buffer, mimeType } = await this.documentsService.getImageBuffer(user.id, params.id);
		return new StreamableFile(buffer, { type: mimeType, disposition: "inline" });
	}

	@Get(":id")
	async findOne(@CurrentUser() user: AuthUser, @Param() params: DocumentIdParamDto) {
		return this.documentsService.findOne(user.id, params.id);
	}

	@Patch(":id")
	async update(
		@CurrentUser() user: AuthUser,
		@Param() params: DocumentIdParamDto,
		@Body() dto: UpdateDocumentDto,
	) {
		return this.documentsService.update(user.id, params.id, dto);
	}

	@Delete(":id")
	@HttpCode(204)
	async softDelete(
		@CurrentUser() user: AuthUser,
		@Param() params: DocumentIdParamDto,
	): Promise<void> {
		await this.documentsService.softDelete(user.id, params.id);
	}
}
