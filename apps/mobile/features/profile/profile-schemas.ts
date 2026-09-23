import { z } from "zod";

export const MeSessionSchema = z.object({
	id: z.string(),
	createdAt: z.string(),
	expiresAt: z.string(),
	ipMasked: z.string(),
	label: z.string(),
	isCurrent: z.boolean(),
});

export type MeSession = z.infer<typeof MeSessionSchema>;

export const MeSessionsResponseSchema = z.array(MeSessionSchema);

export const MeExportDocumentSchema = z.object({
	id: z.string(),
	status: z.string(),
	source: z.string(),
	mimeType: z.string(),
	sizeBytes: z.number(),
	sha256: z.string(),
	documentType: z.string(),
	issuerName: z.string().nullable(),
	issuerTaxId: z.string().nullable(),
	issueDate: z.string().nullable(),
	documentNumber: z.string().nullable(),
	currencyCode: z.string().nullable(),
	totalAmount: z.string().nullable(),
	igvAmount: z.string().nullable(),
	extractionSource: z.string().nullable(),
	wasUserCorrected: z.boolean(),
	category: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const MeExportSchema = z.object({
	exportedAt: z.string(),
	user: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string(),
		createdAt: z.string(),
	}),
	documents: z.array(MeExportDocumentSchema),
});

export type MeExport = z.infer<typeof MeExportSchema>;
