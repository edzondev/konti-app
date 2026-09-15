import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as v from "valibot";
import type { Env } from "../config/env.js";
import type { ExtractedDocument } from "./ingestion.types.js";
import { IsoDateSchema } from "./schemas.js";

interface MistralOcrResponse {
	pages?: Array<{ markdown?: string }>;
	document_annotation?: string | Record<string, unknown>;
}

@Injectable()
export class OcrClient {
	private readonly logger = new Logger(OcrClient.name);
	private readonly apiKey: string;
	private readonly endpoint = "https://api.mistral.ai/v1/ocr";

	constructor(config: ConfigService<Env, true>) {
		this.apiKey = config.getOrThrow("MISTRAL_API_KEY");
	}

	async extract(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
		const body = {
			model: "mistral-ocr-latest",
			document: {
				type: "image_url",
				image_url: `data:${mimeType};base64,${buffer.toString("base64")}`,
			},
		};

		const response = await fetch(this.endpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			this.logger.error(`Mistral OCR failed: ${response.status}`);
			throw new Error(`Mistral OCR failed: ${response.status}`);
		}

		const data = (await response.json()) as MistralOcrResponse;
		const markdown = data.pages?.map((p) => p.markdown ?? "").join("\n") ?? "";

		return parseMarkdown(markdown);
	}
}

// --- Validación de cada campo extraído (valibot) ---
const RucSchema = v.pipe(v.string(), v.regex(/^(10|15|17|20)\d{9}$/));
const DocumentNumberSchema = v.pipe(v.string(), v.regex(/^[BFE]\d{3}-\d{1,8}$/));
const AmountSchema = v.pipe(v.string(), v.regex(/^\d+[.,]\d{2}$/));

// Parser heurístico sobre el markdown que devuelve Mistral: extrae con regex y
// valida cada campo con valibot. Si no encuentra un campo, lo deja en null.
function parseMarkdown(markdown: string): ExtractedDocument {
	const lines = markdown.split("\n").map((l) => l.trim());

	const ruc = markdown.match(/\b(10|15|17|20)\d{9}\b/)?.[0];
	const dateParts = markdown.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
	const amount = markdown.match(/total[^\d]*(\d+[.,]\d{2})/i)?.[1];
	const igv = markdown.match(/igv[^\d]*(\d+[.,]\d{2})/i)?.[1];
	const numberParts = markdown.match(/\b([BFE]\d{3})-?(\d{1,8})\b/);

	const rawDate = dateParts ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}` : undefined;
	const rawNumber = numberParts ? `${numberParts[1]}-${numberParts[2]}` : undefined;

	return {
		documentType: "unknown",
		issuerName: lines[0] || null,
		issuerTaxId: v.is(RucSchema, ruc) ? ruc : null,
		issueDate: v.is(IsoDateSchema, rawDate) ? rawDate : null,
		documentNumber: v.is(DocumentNumberSchema, rawNumber) ? rawNumber : null,
		currencyCode: "PEN",
		totalAmount: v.is(AmountSchema, amount) ? amount.replace(",", ".") : null,
		igvAmount: v.is(AmountSchema, igv) ? igv.replace(",", ".") : null,
	};
}
