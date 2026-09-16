import { createHash } from "node:crypto";
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from "@nestjs/common";
import { and, desc, eq, gte, isNull, lt, lte } from "drizzle-orm";
import {
	type Category,
	categoryLabel,
	DEDUCTIBLE_CATEGORIES,
} from "../ingestion/category-map.js";
import { InjectDatabase } from "../database/database.decorators.js";
import type { Database } from "../database/database.types.js";
import { documents } from "../database/schema/app.schema.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import type { DocumentMimeType } from "../storage/mime.js";
import { buildDocumentObjectKey } from "../storage/object-keys.js";
import { StorageService } from "../storage/storage.service.js";
import { CreateDocumentDto, UpdateDocumentDto } from "./documents.dto.js";
import { generateInsight } from "./insight-rules.js";

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
			userId,
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

		const currentDocs = await this.db
			.select({
				id: documents.id,
				issuerName: documents.issuerName,
				totalAmount: documents.totalAmount,
				category: documents.category,
				issueDate: documents.issueDate,
			})
			.from(documents)
			.where(
				and(
					visibleToUser(userId),
					eq(documents.status, "ready"),
					gte(documents.issueDate, start),
					lte(documents.issueDate, end),
				),
			);

		const historyStart = shiftMonth(target, -3);
		const historyEndExclusive = target; // meses [historyStart, target)
		const { start: histStart } = monthRange(historyStart);
		const { start: histEndExclusive } = monthRange(historyEndExclusive);

		const historyDocs = await this.db
			.select({
				totalAmount: documents.totalAmount,
				issueDate: documents.issueDate,
			})
			.from(documents)
			.where(
				and(
					visibleToUser(userId),
					eq(documents.status, "ready"),
					gte(documents.issueDate, histStart),
					lt(documents.issueDate, histEndExclusive),
				),
			);

		const totalAmount = currentDocs.reduce((acc, d) => acc + Number(d.totalAmount ?? 0), 0);
		const documentCount = currentDocs.length;

		const amountsByCategory = new Map<Category, number>();
		for (const doc of currentDocs) {
			const cat = doc.category;
			amountsByCategory.set(cat, (amountsByCategory.get(cat) ?? 0) + Number(doc.totalAmount ?? 0));
		}

		const categories = [...amountsByCategory.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([name, amount]) => ({ name: categoryLabel(name), amount }));

		const deductibleSet = new Set<Category>(DEDUCTIBLE_CATEGORIES);
		const deductibleDocs = currentDocs.filter((d) => deductibleSet.has(d.category));

		const deductibleByCategory = new Map<
			Category,
			Array<{ id: string; issuerName: string | null; totalAmount: string | null }>
		>();
		for (const doc of deductibleDocs) {
			const cat = doc.category;
			const list = deductibleByCategory.get(cat) ?? [];
			list.push({
				id: doc.id,
				issuerName: doc.issuerName,
				totalAmount: doc.totalAmount,
			});
			deductibleByCategory.set(cat, list);
		}

		const deductibleItems = [...deductibleByCategory.entries()].map(([cat, docs]) => ({
			categoryName: categoryLabel(cat),
			documents: docs,
		}));

		const deductibles = {
			count: deductibleDocs.length,
			totalAmount: deductibleDocs.reduce((acc, d) => acc + Number(d.totalAmount ?? 0), 0),
			categoryNames: [...new Set(deductibleItems.map((i) => i.categoryName))],
			items: deductibleItems,
		};

		// Totales por mes histórico (YYYY-MM → sum)
		const historyTotals = new Map<string, number>();
		for (const doc of historyDocs) {
			if (!doc.issueDate) continue;
			const key = doc.issueDate.slice(0, 7);
			historyTotals.set(key, (historyTotals.get(key) ?? 0) + Number(doc.totalAmount ?? 0));
		}
		const historyMonthTotals = [...historyTotals.values()].filter((v) => v > 0);
		const avg =
			historyMonthTotals.length > 0
				? historyMonthTotals.reduce((a, b) => a + b, 0) / historyMonthTotals.length
				: 0;
		const ratio = avg > 0 ? totalAmount / avg : 0;

		const categoryShares: Partial<Record<Category, number>> = {};
		if (totalAmount > 0) {
			for (const [cat, amount] of amountsByCategory) {
				categoryShares[cat] = amount / totalAmount;
			}
		}

		// monthsWithData: solo meses previos con gasto (el insight de "primer mes" usa === 0)
		const monthsWithData = historyMonthTotals.length;

		const insight = generateInsight({
			monthsWithData,
			currentCount: documentCount,
			avg,
			ratio,
			categoryShares,
		});

		return {
			month: target,
			totalAmount,
			documentCount,
			insight,
			categories,
			deductibles,
		};
	}

	private async processInBackground(
		userId: string,
		documentId: string,
		buffer: Buffer,
		mimeType: DocumentMimeType,
		qrPayload?: string,
		localText?: string,
	): Promise<void> {
		try {
			await this.ingestion.process({
				documentId,
				userId,
				buffer,
				mimeType,
				qrPayload,
				localText,
			});
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

/** Desplaza `YYYY-MM` por `delta` meses. */
function shiftMonth(month: string, delta: number): string {
	const [yearPart, monthPart] = month.split("-");
	const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1 + delta, 1));
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}
