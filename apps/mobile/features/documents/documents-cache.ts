import { getAppStorage } from "@/core/storage";
import { type DocumentListItem, DocumentListSchema } from "./document";

const INDEX_KEY = "documents:__index";
const limaMonthFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: "America/Lima",
	year: "numeric",
	month: "2-digit",
});

function cacheKey(month: string) {
	return `documents:${month}`;
}

function readIndex(storage: ReturnType<typeof getAppStorage>): string[] {
	const raw = storage.getString(INDEX_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? parsed.filter((m): m is string => typeof m === "string") : [];
	} catch {
		return [];
	}
}

function writeIndex(storage: ReturnType<typeof getAppStorage>, months: string[]): void {
	storage.set(INDEX_KEY, JSON.stringify([...new Set(months)]));
}

export function readDocumentsCache(month: string): DocumentListItem[] | undefined {
	const storage = getAppStorage();
	const raw = storage.getString(cacheKey(month));
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
	storage.set(cacheKey(month), JSON.stringify(docs));
	const index = readIndex(storage);
	if (!index.includes(month)) {
		writeIndex(storage, [...index, month]);
	}
}

export function clearDocumentsCache(): void {
	const storage = getAppStorage();
	for (const month of readIndex(storage)) {
		storage.remove(cacheKey(month));
	}
	storage.remove(INDEX_KEY);
}

export function currentLimaMonth(now = new Date()): string {
	const parts = limaMonthFormatter.formatToParts(now);
	const y = parts.find((p) => p.type === "year")?.value;
	const m = parts.find((p) => p.type === "month")?.value;
	return `${y}-${m}`;
}
