import { z } from "zod";
import { QUERY_KEYS } from "@/core/query-keys";
import { queryClient } from "@/core/query-provider";
import { getAppStorage } from "@/core/storage";

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

const INDEX_KEY = "documents:__index";
const monthKey = (month: string) => `documents:${month}`;

function readIndex(): string[] {
	const raw = getAppStorage().getString(INDEX_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === "string") : [];
	} catch {
		return [];
	}
}

export function readDocumentsCache(month: string): DocumentListItem[] | undefined {
	const raw = getAppStorage().getString(monthKey(month));
	if (!raw) return undefined;
	try {
		const parsed = DocumentListSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : undefined;
	} catch {
		return undefined;
	}
}

export function writeDocumentsCache(month: string, docs: DocumentListItem[]): void {
	const storage = getAppStorage();
	storage.set(monthKey(month), JSON.stringify(docs));
	const index = readIndex();
	if (!index.includes(month)) storage.set(INDEX_KEY, JSON.stringify([...index, month]));
}

export function clearDocumentsCache(): void {
	const storage = getAppStorage();
	for (const month of readIndex()) storage.remove(monthKey(month));
	storage.remove(INDEX_KEY);
}

/** Call from the sign-out handler. Not from a session-watching effect. */
export function clearLocalDocuments(): void {
	clearDocumentsCache();
	queryClient.removeQueries({ queryKey: QUERY_KEYS.documents });
}
