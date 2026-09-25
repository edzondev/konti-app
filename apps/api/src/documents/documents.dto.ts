import { createStandardSchemaDTO } from "nestjs-standard-schema";
import * as v from "valibot";
import { CATEGORIES } from "../ingestion/category-map.js";
import { AmountSchema, IsoDateSchema, RucSchema } from "../ingestion/schemas.js";

export const CreateDocumentSchema = v.object({
	source: v.picklist(["camera", "gallery", "share"]),
	qrPayload: v.optional(v.pipe(v.string(), v.maxLength(2000))),
	localText: v.optional(v.pipe(v.string(), v.maxLength(2000))),
});

export const UpdateDocumentSchema = v.object({
	documentType: v.optional(
		v.picklist(["boleta", "factura", "recibo_honorarios", "ticket", "unknown"]),
	),
	issuerName: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
	issuerTaxId: v.optional(v.nullable(RucSchema)),
	issueDate: v.optional(v.nullable(IsoDateSchema)),
	documentNumber: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(50)))),
	currencyCode: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^[A-Z]{3}$/)))),
	totalAmount: v.optional(v.nullable(AmountSchema)),
	igvAmount: v.optional(v.nullable(AmountSchema)),
	category: v.optional(v.picklist(CATEGORIES)),
});

export const ListDocumentsQuerySchema = v.object({
	month: v.optional(v.pipe(v.string(), v.regex(/^\d{4}-(0[1-9]|1[0-2])$/))),
});

export const DeductiblesYearQuerySchema = v.object({
	year: v.optional(v.pipe(v.string(), v.regex(/^\d{4}$/))),
});

export const DocumentIdParamSchema = v.object({
	id: v.pipe(v.string(), v.uuid()),
});

export const CreateDocumentDto = createStandardSchemaDTO(CreateDocumentSchema);
export type CreateDocumentDto = v.InferOutput<typeof CreateDocumentSchema>;

export const UpdateDocumentDto = createStandardSchemaDTO(UpdateDocumentSchema);
export type UpdateDocumentDto = v.InferOutput<typeof UpdateDocumentSchema>;

export const ListDocumentsQueryDto = createStandardSchemaDTO(ListDocumentsQuerySchema);
export type ListDocumentsQueryDto = v.InferOutput<typeof ListDocumentsQuerySchema>;

export const DeductiblesYearQueryDto = createStandardSchemaDTO(DeductiblesYearQuerySchema);
export type DeductiblesYearQueryDto = v.InferOutput<typeof DeductiblesYearQuerySchema>;

export const DocumentIdParamDto = createStandardSchemaDTO(DocumentIdParamSchema);
export type DocumentIdParamDto = v.InferOutput<typeof DocumentIdParamSchema>;
