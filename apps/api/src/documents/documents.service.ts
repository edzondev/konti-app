import { createHash } from "node:crypto";
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { and, count, desc, eq, gte, isNull, lte, sum } from "drizzle-orm";
import { InjectDatabase } from "../database/database.decorators.js";
import type { Database } from "../database/database.types.js";
import { documents } from "../database/schema/app.schema.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import type { DocumentMimeType } from "../storage/mime.js";
import { buildDocumentObjectKey } from "../storage/object-keys.js";
import { StorageService } from "../storage/storage.service.js";
import { CreateDocumentDto, UpdateDocumentDto } from "./documents.dto.js";

interface UploadInput {
	buffer: Buffer;
	size: number;
	mimeType: DocumentMimeType;
}

const EDITABLE_FIELDS = [
	"documentType",
	"issuerName",
	"issuerTaxId",
	"issueDate",
	"documentNumber",
	"currencyCode",
	"totalAmount",
	"igvAmount",
] as const;

@Injectable()
export class DocumentsService {
	private readonly logger = new Logger(DocumentsService.name);

	constructor(
		@InjectDatabase()
		private readonly db: Database,
		private readonly storage: StorageService,
		private readonly ingestion: IngestionService,
	) {}

	async create(userId: string, dto: CreateDocumentDto, file: UploadInput) {
		const sha256 = createHash("sha256").update(file.buffer).digest("hex");

		// Idempotencia: misma imagen del mismo usuario → devolver el existente.
		const [existing] = await this.db
			.select()
			.from(documents)
			.where(
				and(
					eq(documents.userId, userId),
					eq(documents.sha256, sha256),
					isNull(documents.deletedAt),
				),
			)
			.limit(1);

		if (existing) {
			return existing;
		}

		const objectKey = buildDocumentObjectKey(userId, file.mimeType);

		await this.storage.upload(objectKey, file.buffer, file.mimeType);

		let document: typeof documents.$inferSelect;
		try {
			const [inserted] = await this.db
				.insert(documents)
				.values({
					userId,
					status: "pending",
					objectKey,
					mimeType: file.mimeType,
					sizeBytes: file.size,
					sha256,
					source: dto.source,
				})
				.returning();

			if (!inserted) {
				throw new InternalServerErrorException("No se pudo crear el documento");
			}
			document = inserted;
		} catch (error) {
			// Compensación: evitamos dejar un objeto huérfano en el storage.
			await this.storage.delete(objectKey).catch((deleteError: unknown) => {
				this.logger.error(
					`No se pudo limpiar storage tras fallo de insert (sha256=${sha256.slice(0, 12)})`,
					deleteError instanceof Error ? deleteError.stack : undefined,
				);
			});

			// Carrera: otro request insertó el mismo hash vivo.
			if (isUniqueViolation(error)) {
				const [raceWinner] = await this.db
					.select()
					.from(documents)
					.where(
						and(
							eq(documents.userId, userId),
							eq(documents.sha256, sha256),
							isNull(documents.deletedAt),
						),
					)
					.limit(1);
				if (raceWinner) return raceWinner;
			}

			throw error;
		}

		void this.processInBackground(
			document.id,
			file.buffer,
			file.mimeType,
			dto.qrPayload,
			dto.localText,
		);

		return document;
	}

	async list(userId: string, month?: string) {
		const filters = [visibleToUser(userId)];

		if (month) {
			const { start, end } = monthRange(month);
			filters.push(gte(documents.issueDate, start));
			filters.push(lte(documents.issueDate, end));
		}

		return this.db
			.select()
			.from(documents)
			.where(and(...filters))
			.orderBy(desc(documents.issueDate), desc(documents.createdAt));
	}

	async findOne(userId: string, id: string) {
		const [doc] = await this.db
			.select()
			.from(documents)
			.where(and(visibleToUser(userId), eq(documents.id, id)));

		if (!doc) throw new NotFoundException("Document not found");
		return doc;
	}

	async update(userId: string, id: string, dto: UpdateDocumentDto) {
		const current = await this.findOne(userId, id);

		const patch: {
			documentType?: (typeof documents.$inferSelect)["documentType"];
			issuerName?: string | null;
			issuerTaxId?: string | null;
			issueDate?: string | null;
			documentNumber?: string | null;
			currencyCode?: string | null;
			totalAmount?: string | null;
			igvAmount?: string | null;
		} = {};
		let changed = false;

		for (const field of EDITABLE_FIELDS) {
			if (!Object.hasOwn(dto, field)) continue;
			const value = dto[field];
			if (value === undefined) continue;

			if (field === "documentType") {
				patch.documentType = value as (typeof documents.$inferSelect)["documentType"];
			} else {
				patch[field] = value;
			}

			if (!sameFieldValue(current[field], value)) {
				changed = true;
			}
		}

		if (Object.keys(patch).length === 0) {
			throw new BadRequestException("Debes enviar al menos un campo editable");
		}

		const [updated] = await this.db
			.update(documents)
			.set({
				...patch,
				...(changed ? { wasUserCorrected: true } : {}),
				updatedAt: new Date(),
			})
			.where(and(visibleToUser(userId), eq(documents.id, id)))
			.returning();

		if (!updated) throw new NotFoundException("Document not found");
		return updated;
	}

	async getImageUrl(userId: string, id: string): Promise<{ url: string; expiresAt: string }> {
		const doc = await this.findOne(userId, id);
		return this.storage.downloadUrlWithExpiry(doc.objectKey);
	}

	async softDelete(userId: string, id: string): Promise<void> {
		const [updated] = await this.db
			.update(documents)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(and(visibleToUser(userId), eq(documents.id, id)))
			.returning({ id: documents.id });

		if (!updated) throw new NotFoundException("Document not found");
	}

	async summary(userId: string, month?: string) {
		const target = month ?? currentMonth();
		const { start, end } = monthRange(target);

		const where = and(
			visibleToUser(userId),
			eq(documents.status, "ready"),
			gte(documents.issueDate, start),
			lte(documents.issueDate, end),
		);

		// Agregamos en SQL en lugar de traer todas las filas y sumar en JS.
		const [totals] = await this.db
			.select({ documentCount: count(), totalAmount: sum(documents.totalAmount) })
			.from(documents)
			.where(where);

		const [lastDocument] = await this.db
			.select()
			.from(documents)
			.where(where)
			.orderBy(desc(documents.issueDate), desc(documents.createdAt))
			.limit(1);

		return {
			month: target,
			totalAmount: Number(totals?.totalAmount ?? 0),
			documentCount: totals?.documentCount ?? 0,
			lastDocument: lastDocument ?? null,
		};
	}

	private async processInBackground(
		documentId: string,
		buffer: Buffer,
		mimeType: DocumentMimeType,
		qrPayload?: string,
		localText?: string,
	): Promise<void> {
		try {
			await this.ingestion.process({ documentId, buffer, mimeType, qrPayload, localText });
		} catch (error) {
			this.logger.error(
				`Ingesta falló para el documento ${documentId}`,
				error instanceof Error ? error.stack : undefined,
			);
			await this.markFailed(documentId);
		}
	}

	private async markFailed(documentId: string): Promise<void> {
		try {
			await this.db
				.update(documents)
				.set({ status: "failed", updatedAt: new Date() })
				.where(eq(documents.id, documentId));
		} catch (error) {
			this.logger.error(
				`No se pudo marcar el documento ${documentId} como 'failed'`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}

// Filtro compartido: documentos del usuario y no borrados (soft delete).
const visibleToUser = (userId: string) =>
	and(eq(documents.userId, userId), isNull(documents.deletedAt));

function sameFieldValue(current: unknown, next: string | null): boolean {
	if (current === null || current === undefined) return next === null;
	return String(current) === next;
}

function isUniqueViolation(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const code =
		"code" in error
			? String((error as { code: unknown }).code)
			: "cause" in error && error.cause && typeof error.cause === "object" && "code" in error.cause
				? String((error.cause as { code: unknown }).code)
				: undefined;
	return code === "23505";
}

const PERU_TIME_ZONE = "America/Lima";

function currentMonth(): string {
	// TZ explícita: no dependemos de la hora local del servidor.
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: PERU_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
	}).format(new Date());
}

function monthRange(month: string): { start: string; end: string } {
	const [yearPart, monthPart] = month.split("-");
	const year = Number(yearPart);
	const monthNumber = Number(monthPart);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(monthNumber) ||
		monthNumber < 1 ||
		monthNumber > 12
	) {
		throw new BadRequestException(`Formato de mes inválido: ${month}`);
	}

	const start = new Date(Date.UTC(year, monthNumber - 1, 1));
	const end = new Date(Date.UTC(year, monthNumber, 0));
	return {
		start: start.toISOString().slice(0, 10),
		end: end.toISOString().slice(0, 10),
	};
}
