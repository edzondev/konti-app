import { Mistral } from "@mistralai/mistralai";
import type { ConfigService } from "@nestjs/config";
import {
	OcrResultInvalidError,
	parseDocumentAnnotation,
	protectConsumerDocument,
	redactConsumerDocumentFromValue,
} from "./mistral-annotation";
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
				enum: [
					"boleta",
					"factura",
					"recibo_por_honorarios",
					"boleta_de_pago",
					"certificado_retenciones",
					"reporte_sunat",
					"otro",
					null,
				],
			},
			documentNumber: { type: ["string", "null"] },
			currency: { type: ["string", "null"] },
			subtotalAmount: { type: ["string", "null"] },
			taxAmount: { type: ["string", "null"] },
			totalAmount: { type: ["string", "null"] },
			paymentTerms: {
				type: ["string", "null"],
				enum: ["cash", "credit", "unknown", null],
			},
			dueDate: { type: ["string", "null"] },
			actualPaymentDate: { type: ["string", "null"] },
			grossFeeAmount: { type: ["string", "null"] },
			incomeTaxWithheldAmount: { type: ["string", "null"] },
			netPaidAmount: { type: ["string", "null"] },
			payerName: { type: ["string", "null"] },
			employmentRecordKind: {
				type: ["string", "null"],
				enum: ["period", "year_to_date_snapshot", null],
			},
			employmentGrossAmount: { type: ["string", "null"] },
			employmentWithheldTaxAmount: { type: ["string", "null"] },
			coverageStart: { type: ["string", "null"] },
			coverageEnd: { type: ["string", "null"] },
			coverageScope: {
				type: ["string", "null"],
				enum: ["single_payer", "all_employers", null],
			},
			employerName: { type: ["string", "null"] },
			employerTaxId: { type: ["string", "null"] },
			deductionCategoryHint: {
				type: ["string", "null"],
				enum: [
					"restaurants_hotels",
					"medical_dental_services",
					"other_fourth_services",
					"rent",
					"household_worker_essalud",
					null,
				],
			},
			serviceDescription: { type: ["string", "null"] },
			amountPaid: { type: ["string", "null"] },
			insuranceReimbursementAmount: { type: ["string", "null"] },
			paymentMethodEvidence: { type: ["string", "null"] },
			propertyCountry: { type: ["string", "null"] },
			propertyUse: { type: ["string", "null"] },
			supportingFormNumber: { type: ["string", "null"] },
			workerRegistrationEvidence: { type: ["string", "null"] },
			attributionHint: {
				type: ["string", "null"],
				enum: ["taxpayer", "spouse_or_partner", "unknown", null],
			},
			consumerDocumentNumber: { type: ["string", "null"] },
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
			"paymentTerms",
			"dueDate",
			"actualPaymentDate",
			"grossFeeAmount",
			"incomeTaxWithheldAmount",
			"netPaidAmount",
			"payerName",
			"employmentRecordKind",
			"employmentGrossAmount",
			"employmentWithheldTaxAmount",
			"coverageStart",
			"coverageEnd",
			"coverageScope",
			"employerName",
			"employerTaxId",
			"deductionCategoryHint",
			"serviceDescription",
			"amountPaid",
			"insuranceReimbursementAmount",
			"paymentMethodEvidence",
			"propertyCountry",
			"propertyUse",
			"supportingFormNumber",
			"workerRegistrationEvidence",
			"attributionHint",
			"consumerDocumentNumber",
		],
	},
};

export class MistralOcrProvider implements OcrProvider {
	readonly provider = PROVIDER;
	private readonly client: Mistral;
	private readonly model: string;
	private readonly dniHmacSecret: string | null;

	constructor(config: ConfigService) {
		const apiKey = config.get<string>("MISTRAL_API_KEY");
		if (!apiKey) {
			throw new Error("Missing MISTRAL_API_KEY");
		}
		this.client = new Mistral({ apiKey });
		this.model = config.get<string>("MISTRAL_OCR_MODEL") ?? "mistral-ocr-4-0";
		this.dniHmacSecret = config.get<string>("KONTI_DNI_HMAC_KEY") ?? null;
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
					"Extrae datos de un comprobante peruano en una sola respuesta. Para recibos por honorarios: paymentTerms es cash, credit o unknown; dueDate es solo vencimiento/cuota; actualPaymentDate existe únicamente si el documento afirma que el dinero ya fue pagado o cobrado. Una fecha de cuota o vencimiento nunca es actualPaymentDate. Separa esas fechas de issueDate. Extrae honorario bruto, retención del Impuesto a la Renta, neto pagado y pagador. Para boletas de pago, certificados de retención o reportes SUNAT: employmentRecordKind es period solo si representa un periodo aislado y year_to_date_snapshot solo si es acumulado; coverageStart y coverageEnd son el rango expresamente indicado; coverageScope es all_employers solo si el documento afirma que consolida todos los empleadores, de lo contrario single_payer únicamente cuando identifica un empleador; extrae remuneración bruta, retención de quinta y empleador. Para gastos deducibles, deductionCategoryHint es solo una sugerencia basada en texto expreso; extrae descripción, importe pagado, reembolso de seguro, evidencia de medio de pago, país/uso del inmueble, formulario 1683/1676, registro del trabajador y atribución únicamente si aparecen. consumerDocumentNumber es únicamente el DNI de 8 dígitos que el comprobante atribuye expresamente al consumidor; no inventes ni uses el RUC del emisor o pagador. Konti lo protegerá y descartará el valor crudo antes de persistir. OCR es evidencia, no verificación SUNAT. No deduzcas el mes desde issueDate ni inventes alcance o fechas. No uses impuestos genéricos como retención. Devuelve null para todo dato ausente.",
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

		const rawFields = parseDocumentAnnotation(documentAnnotation);
		const protectedResult = protectConsumerDocument(
			rawFields,
			documentAnnotation,
			this.dniHmacSecret,
		);
		const pageConfidence = response.pages[0]?.confidenceScores?.averagePageConfidenceScore ?? null;

		return {
			fields: protectedResult.fields,
			pageConfidence,
			fieldConfidence: {
				issuerTaxId: null,
				issueDate: null,
				totalAmount: null,
				documentType: null,
			},
			rawPayload: {
				pagesMarkdown: redactConsumerDocumentFromValue(
					response.pages.map((page) => page.markdown),
					rawFields.consumerDocumentNumber ?? null,
				),
				documentAnnotation: protectedResult.sanitizedAnnotation,
			},
			provider: PROVIDER,
			providerVersion: this.model,
		};
	}
}
