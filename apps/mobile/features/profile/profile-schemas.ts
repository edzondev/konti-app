import * as v from "valibot";

export const MeSessionSchema = v.object({
	id: v.string(),
	createdAt: v.string(),
	expiresAt: v.string(),
	ipMasked: v.string(),
	label: v.string(),
	isCurrent: v.boolean(),
});

export type MeSession = v.InferOutput<typeof MeSessionSchema>;

export const MeSessionsResponseSchema = v.array(MeSessionSchema);

export const MeExportDocumentSchema = v.object({
	id: v.string(),
	status: v.string(),
	source: v.string(),
	mimeType: v.string(),
	sizeBytes: v.number(),
	sha256: v.string(),
	documentType: v.string(),
	issuerName: v.nullable(v.string()),
	issuerTaxId: v.nullable(v.string()),
	issueDate: v.nullable(v.string()),
	documentNumber: v.nullable(v.string()),
	currencyCode: v.nullable(v.string()),
	totalAmount: v.nullable(v.string()),
	igvAmount: v.nullable(v.string()),
	extractionSource: v.nullable(v.string()),
	wasUserCorrected: v.boolean(),
	category: v.string(),
	createdAt: v.string(),
	updatedAt: v.string(),
});

export const MeExportSchema = v.object({
	exportedAt: v.string(),
	user: v.object({
		id: v.string(),
		name: v.string(),
		email: v.string(),
		createdAt: v.string(),
	}),
	documents: v.array(MeExportDocumentSchema),
});

export type MeExport = v.InferOutput<typeof MeExportSchema>;
