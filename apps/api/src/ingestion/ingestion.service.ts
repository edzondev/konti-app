import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDrizzle } from "@nestjs/drizzle";
import { and, asc, count, desc, eq, gte, isNotNull, isNull } from "drizzle-orm";
import type { Env } from "../config/env.js";
import type { Database } from "../database/database.types.js";
import { documents } from "../database/schema/app.schema.js";
import { type Category, categorizeByName } from "./category-map.js";
import { FieldJudge } from "./field-judge.js";
import { type ExtractedDocument, emptyExtraction } from "./ingestion.types.js";
import { OcrClient } from "./ocr-client.js";
import { parseQrPayload } from "./qr-parser.js";

interface IngestionInput {
	documentId: string;
	userId: string;
	buffer: Buffer;
	mimeType: string;
	qrPayload?: string;
}

type ExtractionSource = "qr" | "ocr" | "manual";

const PERU_TIME_ZONE = "America/Lima";

@Injectable()
export class IngestionService {
	private readonly logger = new Logger(IngestionService.name);

	constructor(
		@InjectDrizzle()
		private readonly db: Database,
		private readonly ocr: OcrClient,
		private readonly fields: FieldJudge,
		private readonly config: ConfigService<Env, true>,
	) {}

	async process(input: IngestionInput): Promise<void> {
		const { extracted, source } = await this.extract(input);
		const category = await this.resolveCategory(input.userId, extracted);
		const drop = await this.shouldDropDuplicate(input, extracted);
		const incomplete = isExtractionIncomplete(extracted.totalAmount);
		const status =
			drop || source === "manual" || (source === "ocr" && incomplete)
				? "pending"
				: incomplete
					? "failed"
					: "ready";

		// No pisar soft-delete, docs ya listos/fallidos, ni correcciones del usuario.
		const [applied] = await this.db
			.update(documents)
			.set({
				...extracted,
				category,
				status,
				extractionSource: source,
				...(drop ? { deletedAt: new Date() } : {}),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(documents.id, input.documentId),
					eq(documents.status, "pending"),
					eq(documents.wasUserCorrected, false),
					isNull(documents.deletedAt),
				),
			)
			.returning({ id: documents.id });

		if (!applied) {
			this.logger.warn(
				`document ${input.documentId} ingest skipped (not pending, corrected, or deleted)`,
			);
			return;
		}

		this.logger.log(`document ${input.documentId} ${status} via ${source} category=${category}`);
	}

	/** Mismo RUC + número, otro vivo más antiguo (o del mismo instante): el actual se oculta. */
	private async shouldDropDuplicate(
		input: IngestionInput,
		extracted: ExtractedDocument,
	): Promise<boolean> {
		const issuerTaxId = extracted.issuerTaxId?.trim();
		const documentNumber = extracted.documentNumber?.trim();
		if (!issuerTaxId || !documentNumber) return false;

		// Los 2 más antiguos bastan: si el actual no está ahí, es más nuevo.
		const rows = await this.db
			.select({ id: documents.id, createdAt: documents.createdAt })
			.from(documents)
			.where(
				and(
					eq(documents.userId, input.userId),
					eq(documents.issuerTaxId, issuerTaxId),
					eq(documents.documentNumber, documentNumber),
					isNull(documents.deletedAt),
				),
			)
			.orderBy(asc(documents.createdAt))
			.limit(2);

		return shouldSoftDeleteDuplicate(input.documentId, rows);
	}

	/**
	 * Si hay issuerName → categorizeByName.
	 * Si no, busca un nombre conocido del mismo usuario+RUC en documentos previos.
	 */
	private async resolveCategory(userId: string, extracted: ExtractedDocument): Promise<Category> {
		if (extracted.issuerName?.trim()) {
			return categorizeByName(extracted.issuerName);
		}

		if (!extracted.issuerTaxId?.trim()) {
			return "otros";
		}

		const [known] = await this.db
			.select({ issuerName: documents.issuerName })
			.from(documents)
			.where(
				and(
					eq(documents.userId, userId),
					eq(documents.issuerTaxId, extracted.issuerTaxId),
					isNotNull(documents.issuerName),
				),
			)
			.orderBy(desc(documents.createdAt))
			.limit(1);

		if (known?.issuerName) {
			return categorizeByName(known.issuerName);
		}

		return "otros";
	}

	private async extract(
		input: IngestionInput,
	): Promise<{ extracted: ExtractedDocument; source: ExtractionSource }> {
		if (input.qrPayload) {
			const parsed = parseQrPayload(input.qrPayload);
			if (parsed) {
				return { extracted: parsed, source: "qr" };
			}
			this.logger.warn(`QR parse failed for document ${input.documentId}`);
		}

		const budgetAvailable = await this.hasOcrBudget();
		if (!budgetAvailable) {
			this.logger.warn(`OCR budget exhausted, degrading document ${input.documentId} to manual`);
			return { extracted: emptyExtraction(), source: "manual" };
		}

		const markdown = await this.ocr.extract(input.buffer, input.mimeType);
		if (!markdown.trim()) {
			return { extracted: emptyExtraction(), source: "ocr" };
		}

		try {
			const picked = await this.fields.pick(markdown);
			if (!picked.confident) {
				// Conservar emisor/fecha/etc.; solo el total va a revisión.
				return {
					extracted: { ...picked.extracted, totalAmount: null },
					source: "ocr",
				};
			}
			return { extracted: picked.extracted, source: "ocr" };
		} catch (error) {
			this.logger.warn(
				`TypeSafe failed for document ${input.documentId}; keeping OCR slot as pending`,
				error instanceof Error ? error.message : undefined,
			);
			return { extracted: emptyExtraction(), source: "ocr" };
		}
	}

	/** Tope global de la API: cuenta docs del mes (Lima) ya marcados como ocr. */
	private async hasOcrBudget(): Promise<boolean> {
		const startOfMonth = startOfMonthInLima();
		const [result] = await this.db
			.select({ count: count() })
			.from(documents)
			.where(and(eq(documents.extractionSource, "ocr"), gte(documents.createdAt, startOfMonth)));

		const limit = this.config.get("OCR_MONTHLY_LIMIT");
		return (result?.count ?? 0) < limit;
	}
}

/** El más antiguo gana. `rows` son vivos con el mismo RUC y número, más antiguos primero. */
export function shouldSoftDeleteDuplicate(
	currentId: string,
	rows: ReadonlyArray<{ id: string; createdAt: Date }>,
): boolean {
	const current = rows.find((row) => row.id === currentId);
	return rows.some((row) => {
		if (row.id === currentId) return false;
		if (!current) return true;
		return row.createdAt.getTime() <= current.createdAt.getTime();
	});
}

/** Incomplete = no usable total: null/empty, NaN, or <= 0. */
function isExtractionIncomplete(totalAmount: string | null | undefined): boolean {
	if (totalAmount == null || totalAmount === "") return true;
	const n = Number(totalAmount);
	return Number.isNaN(n) || n <= 0;
}

function startOfMonthInLima(): Date {
	const yearMonth = new Intl.DateTimeFormat("en-CA", {
		timeZone: PERU_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
	}).format(new Date());
	const [yearPart, monthPart] = yearMonth.split("-");
	const year = Number(yearPart);
	const month = Number(monthPart);
	// Medianoche Lima ≈ 05:00 UTC (sin DST en Perú).
	return new Date(Date.UTC(year, month - 1, 1, 5, 0, 0));
}
