import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { InjectDatabase } from "../database/database.decorators.js";
import type { Database } from "../database/database.types.js";
import { documents } from "../database/schema/app.schema.js";
import type { ExtractedDocument } from "./ingestion.types.js";
import { OcrClient } from "./ocr-client.js";
import { parseQrPayload } from "./qr-parser.js";

interface IngestionInput {
	documentId: string;
	buffer: Buffer;
	mimeType: string;
	qrPayload?: string;
}

@Injectable()
export class IngestionService {
	private readonly logger = new Logger(IngestionService.name);

	constructor(
		@InjectDatabase()
		private readonly db: Database,
		private readonly ocr: OcrClient,
	) {}

	async process(input: IngestionInput): Promise<void> {
		const { extracted, source } = await this.extract(input);

		await this.db
			.update(documents)
			.set({
				...extracted,
				status: "ready",
				extractionSource: source,
				updatedAt: new Date(),
			})
			.where(eq(documents.id, input.documentId));

		this.logger.log(`document ${input.documentId} ready via ${source}`);
	}

	private async extract(
		input: IngestionInput,
	): Promise<{ extracted: ExtractedDocument; source: "qr" | "ocr" }> {
		if (input.qrPayload) {
			const parsed = parseQrPayload(input.qrPayload);
			if (parsed) {
				return { extracted: parsed, source: "qr" };
			}
			this.logger.warn(`QR parse failed for document ${input.documentId}, falling back to OCR`);
		}

		const extracted = await this.ocr.extract(input.buffer, input.mimeType);
		return { extracted, source: "ocr" };
	}
}
