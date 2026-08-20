import { Mistral } from "@mistralai/mistralai";
import type { ConfigService } from "@nestjs/config";
import { OcrResultInvalidError, parseDocumentAnnotation } from "./mistral-annotation";
import type { OcrExtractInput, OcrExtractResult, OcrProvider } from "./ocr.types";

const OCR_TIMEOUT_MS = 45_000;
const PROVIDER = "mistral";

export const KONTI_RECEIPT_SCHEMA = {
	name: "konti_receipt",
	strict: true,
	schemaDefinition: {
		type: "object",
		additionalProperties: false,
		properties: {
			issuerTaxId: { type: ["string", "null"] },
			issuerName: { type: ["string", "null"] },
			issueDate: { type: ["string", "null"] },
			documentType: {
				type: ["string", "null"],
				enum: ["boleta", "factura", "recibo_por_honorarios", "boleta_de_pago", "otro", null],
			},
			documentNumber: { type: ["string", "null"] },
			currency: { type: ["string", "null"] },
			subtotalAmount: { type: ["string", "null"] },
			taxAmount: { type: ["string", "null"] },
			totalAmount: { type: ["string", "null"] },
		},
		required: [
			"issuerTaxId",
			"issuerName",
			"issueDate",
			"documentType",
			"documentNumber",
			"currency",
			"subtotalAmount",
			"taxAmount",
			"totalAmount",
		],
	},
};

export class MistralOcrProvider implements OcrProvider {
	readonly provider = PROVIDER;
	private readonly client: Mistral;
	private readonly model: string;

	constructor(config: ConfigService) {
		const apiKey = config.get<string>("MISTRAL_API_KEY");
		if (!apiKey) {
			throw new Error("Missing MISTRAL_API_KEY");
		}
		this.client = new Mistral({ apiKey });
		this.model = config.get<string>("MISTRAL_OCR_MODEL") ?? "mistral-ocr-4-0";
	}

	async extract(input: OcrExtractInput): Promise<OcrExtractResult> {
		const response = await this.client.ocr.process(
			{
				model: this.model,
				document: {
					type: "image_url",
					imageUrl: input.imageUrl,
				},
				documentAnnotationFormat: {
					type: "json_schema",
					jsonSchema: KONTI_RECEIPT_SCHEMA,
				},
				documentAnnotationPrompt:
					"Extrae datos de un comprobante peruano (boleta, factura o recibo). No inventes campos.",
				includeImageBase64: false,
				includeBlocks: false,
			},
			{ timeoutMs: OCR_TIMEOUT_MS },
		);

		const documentAnnotation = response.documentAnnotation;
		if (
			documentAnnotation === null ||
			documentAnnotation === undefined ||
			documentAnnotation === ""
		) {
			throw new OcrResultInvalidError();
		}

		const fields = parseDocumentAnnotation(documentAnnotation);
		const pageConfidence = response.pages[0]?.confidenceScores?.averagePageConfidenceScore ?? null;

		return {
			fields,
			pageConfidence,
			fieldConfidence: {
				issuerTaxId: null,
				issueDate: null,
				totalAmount: null,
				documentType: null,
			},
			rawPayload: {
				pagesMarkdown: response.pages.map((page) => page.markdown),
				documentAnnotation,
			},
			provider: PROVIDER,
			providerVersion: this.model,
		};
	}
}
