import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { and, count, desc, eq, gte, isNotNull, isNull } from "drizzle-orm";
import type { Env } from "../config/env.js";
import { InjectDatabase } from "../database/database.decorators.js";
import type { Database } from "../database/database.types.js";
import { documents } from "../database/schema/app.schema.js";
import { type Category, categorizeByName } from "./category-map.js";
import type { ExtractedDocument } from "./ingestion.types.js";
import { parseLocalText } from "./local-parser.js";
import { OcrClient } from "./ocr-client.js";
import { parseQrPayload } from "./qr-parser.js";

interface IngestionInput {
	documentId: string;
	userId: string;
	buffer: Buffer;
	mimeType: string;
	qrPayload?: string;
	localText?: string;
}

type ExtractionSource = "qr" | "local" | "ocr" | "manual";

const PERU_TIME_ZONE = "America/Lima";

@Injectable()
export class IngestionService {
	private readonly logger = new Logger(IngestionService.name);

	constructor(
		@InjectDatabase()
		private readonly db: Database,
		private readonly ocr: OcrClient,
		private readonly config: ConfigService<Env, true>,
	) {}

	async process(input: IngestionInput): Promise<void> {
		const { extracted, source } = await this.extract(input);
		const category = await this.resolveCategory(input.userId, extracted);
		const status = isExtractionIncomplete(extracted.totalAmount) ? "failed" : "ready";

		// No pisar soft-delete, docs ya listos/fallidos, ni correcciones del usuario.
		const [applied] = await this.db
			.update(documents)
			.set({
				...extracted,
				category,
				status,
				extractionSource: source,
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

		if (input.localText) {
			const parsed = parseLocalText(input.localText);
			if (parsed) {
				return { extracted: parsed, source: "local" };
			}
			this.logger.warn(`Local parse failed for document ${input.documentId}`);
		}

		const budgetAvailable = await this.hasOcrBudget();
		if (!budgetAvailable) {
			this.logger.warn(`OCR budget exhausted, degrading document ${input.documentId} to manual`);
			return { extracted: emptyExtraction(), source: "manual" };
		}

		const extracted = await this.ocr.extract(input.buffer, input.mimeType);
		return { extracted, source: "ocr" };
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

function emptyExtraction(): ExtractedDocument {
	return {
		documentType: "unknown",
		issuerName: null,
		issuerTaxId: null,
		issueDate: null,
		documentNumber: null,
		currencyCode: null,
		totalAmount: null,
		igvAmount: null,
	};
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
