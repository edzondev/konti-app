import { z } from "zod";

import { getAppStorage } from "@/core/storage";

export const DocumentSchema = z.object({
	status: z.enum(["pending", "ready", "failed"]),
	extractionSource: z.enum(["qr", "ocr", "local", "manual"]).nullable(),
	source: z.enum(["camera", "gallery", "share"]),
	documentType: z.enum(["boleta", "factura", "recibo_honorarios", "ticket", "unknown"]),
	category: z.enum([
		"restaurantes",
		"supermercado",
		"transporte",
		"servicios_medicos",
		"servicios_profesionales",
		"hogar_servicios",
		"entretenimiento",
		"educacion",
		"otros",
	]),
	id: z.string(),
	issuerName: z.string().nullable(),
	issuerTaxId: z.string().nullable(),
	issueDate: z.string().nullable(),
	documentNumber: z.string().nullable(),
	currencyCode: z.string().nullable(),
	totalAmount: z.string().nullable(),
	igvAmount: z.string().nullable(),
	createdAt: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;

const DocumentsCacheSchema = z.array(DocumentSchema);

const documentsMemory = new Map<string, Document[] | undefined>();

function documentsCacheKey(userId: string, month: string): string {
	return `user_${userId}_documents_${month}`;
}

export function forgetDocumentsMemory(userId: string): void {
	const prefix = `user_${userId}_documents_`;
	for (const key of documentsMemory.keys()) {
		if (key.startsWith(prefix)) documentsMemory.delete(key);
	}
}

export function writeCachedDocuments(userId: string, month: string, documents: Document[]): void {
	const key = documentsCacheKey(userId, month);
	documentsMemory.set(key, documents);
	getAppStorage().set(key, JSON.stringify(documents));
}

export function readCachedDocuments(userId: string, month: string): Document[] | undefined {
	const key = documentsCacheKey(userId, month);
	if (documentsMemory.has(key)) return documentsMemory.get(key);
	const raw = getAppStorage().getString(key);
	if (!raw) {
		documentsMemory.set(key, undefined);
		return undefined;
	}
	try {
		const parsed = DocumentsCacheSchema.safeParse(JSON.parse(raw));
		const value = parsed.success ? parsed.data : undefined;
		documentsMemory.set(key, value);
		return value;
	} catch {
		documentsMemory.set(key, undefined);
		return undefined;
	}
}

export async function loadDocuments(
	userId: string,
	month: string,
	fetchMonth: (month: string) => Promise<Document[]>,
	signal?: AbortSignal,
): Promise<Document[]> {
	try {
		const documents = await fetchMonth(month);
		if (!signal?.aborted) writeCachedDocuments(userId, month, documents);
		return documents;
	} catch (error) {
		const cached = readCachedDocuments(userId, month);
		if (cached) return cached;
		throw error;
	}
}
