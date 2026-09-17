import { z } from "zod";

export const DocumentStatusSchema = z.enum(["pending", "ready", "failed"]);
export const DocumentTypeSchema = z.enum([
	"boleta",
	"factura",
	"recibo_honorarios",
	"ticket",
	"unknown",
]);
export const DocumentSourceSchema = z.enum(["camera", "gallery", "share"]);

export const DocumentListItemSchema = z
	.object({
		id: z.uuid(),
		status: DocumentStatusSchema,
		issuerName: z.string().nullable(),
		totalAmount: z.string().nullable(),
		currencyCode: z.string().nullable(),
		issueDate: z.string().nullable(),
		category: z.string(),
		documentType: z.string(),
		createdAt: z.string().optional(),
		issuerTaxId: z.string().nullable().optional(),
		documentNumber: z.string().nullable().optional(),
		source: DocumentSourceSchema.optional(),
		igvAmount: z.string().nullable().optional(),
	})
	.loose();

export const DocumentListSchema = z.array(DocumentListItemSchema);

export const DocumentImageSchema = z.object({
	url: z.string(),
	expiresAt: z.string(),
});

export const UpdateDocumentSchema = z.object({
	documentType: DocumentTypeSchema.optional(),
	issuerName: z.string().nullable().optional(),
	issuerTaxId: z.string().nullable().optional(),
	issueDate: z.string().nullable().optional(),
	documentNumber: z.string().nullable().optional(),
	totalAmount: z.string().nullable().optional(),
	igvAmount: z.string().nullable().optional(),
});

export type DocumentListItem = z.infer<typeof DocumentListItemSchema>;
export type DocumentImage = z.infer<typeof DocumentImageSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
