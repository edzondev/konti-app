import { z } from "zod";

export const DocumentListItemSchema = z
	.object({
		id: z.string().uuid(),
		status: z.enum(["pending", "ready", "failed"]),
		issuerName: z.string().nullable(),
		totalAmount: z.string().nullable(),
		currencyCode: z.string().nullable(),
		issueDate: z.string().nullable(),
		category: z.string(),
		documentType: z.string(),
	})
	.passthrough();

export const DocumentListSchema = z.array(DocumentListItemSchema);

export type DocumentListItem = z.infer<typeof DocumentListItemSchema>;
