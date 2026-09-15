import { createStandardSchemaDTO } from "nestjs-standard-schema";
import * as v from "valibot";

export const CreateDocumentSchema = v.object({
	source: v.picklist(["camera", "gallery", "share"]),
	qrPayload: v.optional(v.pipe(v.string(), v.maxLength(2000))),
});

export const ListDocumentsQuerySchema = v.object({
	month: v.optional(v.pipe(v.string(), v.regex(/^\d{4}-(0[1-9]|1[0-2])$/))),
});

export const DocumentIdParamSchema = v.object({
	id: v.pipe(v.string(), v.uuid()),
});

export const CreateDocumentDto = createStandardSchemaDTO(CreateDocumentSchema);
export type CreateDocumentDto = v.InferOutput<typeof CreateDocumentSchema>;

export const ListDocumentsQueryDto = createStandardSchemaDTO(ListDocumentsQuerySchema);
export type ListDocumentsQueryDto = v.InferOutput<typeof ListDocumentsQuerySchema>;

export const DocumentIdParamDto = createStandardSchemaDTO(DocumentIdParamSchema);
export type DocumentIdParamDto = v.InferOutput<typeof DocumentIdParamSchema>;
