import * as v from "valibot";

import { getAppStorage } from "@/core/storage";

export const DocumentSchema = v.object({
	status: v.picklist(["pending", "ready", "failed"]),
	extractionSource: v.nullable(v.picklist(["qr", "ocr", "manual"])),
	source: v.picklist(["camera", "gallery", "share"]),
	documentType: v.picklist(["boleta", "factura", "recibo_honorarios", "ticket", "unknown"]),
	category: v.picklist([
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
	id: v.string(),
	issuerName: v.nullable(v.string()),
	issuerTaxId: v.nullable(v.string()),
	issueDate: v.nullable(v.string()),
	documentNumber: v.nullable(v.string()),
	currencyCode: v.nullable(v.string()),
	totalAmount: v.nullable(v.string()),
	igvAmount: v.nullable(v.string()),
	createdAt: v.string(),
});

export type Document = v.InferOutput<typeof DocumentSchema>;

const DocumentsCacheSchema = v.array(DocumentSchema);

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
		const parsed = v.safeParse(DocumentsCacheSchema, JSON.parse(raw));
		const value = parsed.success ? parsed.output : undefined;
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
