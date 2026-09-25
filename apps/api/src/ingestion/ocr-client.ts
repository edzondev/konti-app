import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as v from "valibot";
import type { Env } from "../config/env.js";
import type { ExtractedDocument } from "./ingestion.types.js";
import { AmountSchema, DocumentNumberSchema, IsoDateSchema, RucSchema } from "./schemas.js";

interface MistralOcrResponse {
	pages?: Array<{ markdown?: string }>;
	document_annotation?: string | Record<string, unknown>;
}

@Injectable()
export class OcrClient {
	private readonly logger = new Logger(OcrClient.name);
	private readonly apiKey: string;
	private readonly endpoint = "https://api.mistral.ai/v1/ocr";
	private readonly timeoutMs: number;

	constructor(config: ConfigService<Env, true>) {
		this.apiKey = config.getOrThrow("MISTRAL_API_KEY");
		this.timeoutMs = config.get("OCR_TIMEOUT_MS");
	}

	async extract(buffer: Buffer, mimeType: string): Promise<ExtractedDocument> {
		const body = {
			model: "mistral-ocr-latest",
			document: {
				type: "image_url",
				image_url: `data:${mimeType};base64,${buffer.toString("base64")}`,
			},
		};

		let response: Response;
		try {
			response = await fetch(this.endpoint, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(this.timeoutMs),
			});
		} catch (error) {
			if (error instanceof Error && error.name === "TimeoutError") {
				this.logger.error(`Mistral OCR timed out after ${this.timeoutMs}ms`);
				throw new Error(`Mistral OCR timed out after ${this.timeoutMs}ms`);
			}
			throw error;
		}

		if (!response.ok) {
			this.logger.error(`Mistral OCR failed: ${response.status}`);
			throw new Error(`Mistral OCR failed: ${response.status}`);
		}

		const data = (await response.json()) as MistralOcrResponse;
		const markdown = data.pages?.map((p) => p.markdown ?? "").join("\n") ?? "";

		return parseMarkdown(markdown);
	}
}

const IMAGE_LINE = /^!\[[^\]]*]\([^)]*\)$/;
const TOTAL_LABEL =
	/\b(?:importe\s+a\s+pagar|importe\s+total|monto\s+total|total\s+a\s+pagar|total)\b/i;
const IGV_LABEL = /\bigv\b/i;
const ISSUER_NOISE =
	/^(?:ruc|fecha|boleta|factura|ticket|recibo|serie|n(?:ú|u)mero|importe|total|igv|op\.?|cantidad|descripci[oó]n)\b/i;

// Parser heurístico sobre el markdown que devuelve Mistral: extrae con regex y
// valida cada campo con valibot. Si no encuentra un campo, lo deja en null.
export function parseMarkdown(markdown: string): ExtractedDocument {
	const lines = markdown.split("\n").map((l) => l.trim());

	const ruc = markdown.match(/\b(10|15|17|20)\d{9}\b/)?.[0];
	const dateParts = markdown.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
	const amount = labeledAmount(lines, TOTAL_LABEL) ?? largestAmount(markdown);
	const igv = labeledAmount(lines, IGV_LABEL);
	const numberParts = markdown.match(/\b([BFE]\d{3})-?(\d{1,8})\b/);

	const rawDate = dateParts ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}` : undefined;
	const rawNumber = numberParts ? `${numberParts[1]}-${numberParts[2]}` : undefined;

	return {
		documentType: documentTypeOf(markdown),
		issuerName: issuerNameOf(lines),
		issuerTaxId: v.is(RucSchema, ruc) ? ruc : null,
		issueDate: v.is(IsoDateSchema, rawDate) ? rawDate : null,
		documentNumber: v.is(DocumentNumberSchema, rawNumber) ? rawNumber : null,
		currencyCode: "PEN",
		totalAmount: amount ?? null,
		igvAmount: igv ?? null,
	};
}

function labeledAmount(lines: string[], label: RegExp): string | undefined {
	let found: string | undefined;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		if (!label.test(line)) continue;
		const amount = moneyValues(line).at(-1) ?? amountBelow(lines, i);
		if (amount) found = amount;
	}
	return found;
}

function amountBelow(lines: string[], index: number): string | undefined {
	const end = Math.min(lines.length, index + 4);
	for (let j = index + 1; j < end; j++) {
		const line = lines[j] ?? "";
		if (!line) continue;
		return moneyOnly(line);
	}
	return undefined;
}

function moneyOnly(line: string): string | undefined {
	const cleaned = line
		.replaceAll("|", " ")
		.replaceAll("*", " ")
		.replace(/^#+\s*/, "")
		.trim();
	const values = moneyValues(cleaned);
	if (values.length !== 1) return undefined;
	const rest = cleaned
		.replace(/\d{1,3}(?:[.,]\d{3})+[.,]\d{2}|\d+[.,]\d{2}/g, "")
		.replace(/s\/\.?/gi, "")
		.trim();
	return rest.length === 0 ? values[0] : undefined;
}

// ponytail: el monto mayor cuando no hay total etiquetado. Falla si un precio de línea supera al total (descuento).
function largestAmount(markdown: string): string | undefined {
	return moneyValues(markdown).reduce<string | undefined>((best, value) => {
		if (!best || Number(value) > Number(best)) return value;
		return best;
	}, undefined);
}

function moneyValues(line: string): string[] {
	return [...line.matchAll(/\d{1,3}(?:[.,]\d{3})+[.,]\d{2}|\d+[.,]\d{2}/g)]
		.map((match) => moneyValue(match[0]))
		.filter((value): value is string => value !== null);
}

function moneyValue(raw: string): string | null {
	const comma = raw.lastIndexOf(",");
	const dot = raw.lastIndexOf(".");
	const normalized =
		comma > dot ? raw.replaceAll(".", "").replace(",", ".") : raw.replaceAll(",", "");
	return v.is(AmountSchema, normalized) ? normalized : null;
}

function documentTypeOf(markdown: string): ExtractedDocument["documentType"] {
	if (/recibo\s+(?:por\s+)?honorarios/i.test(markdown)) return "recibo_honorarios";
	if (/\bfactura\b/i.test(markdown)) return "factura";
	if (/\bboleta\b/i.test(markdown)) return "boleta";
	if (/\bticket\b/i.test(markdown)) return "ticket";
	return "unknown";
}

function issuerNameOf(lines: string[]): string | null {
	for (const raw of lines) {
		if (!raw || IMAGE_LINE.test(raw)) continue;
		const line = raw
			.replace(/^#+\s*/, "")
			.replaceAll("*", "")
			.trim();
		if (!line || IMAGE_LINE.test(line) || ISSUER_NOISE.test(line)) continue;
		if (line.startsWith("|") || /^-{3,}$/.test(line)) continue;
		if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3}/.test(line)) continue;
		return line;
	}
	return null;
}
