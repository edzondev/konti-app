import { z } from "zod";

import { getAppStorage } from "@/core/storage";

export const HomeSummarySchema = z.object({
	month: z.string(),
	totalAmount: z.number(),
	documentCount: z.number(),
	processingCount: z.number(),
	insight: z.string(),
	categories: z.array(
		z.object({
			name: z.string(),
			amount: z.number(),
		}),
	),
	deductibles: z.object({
		count: z.number(),
		totalAmount: z.number(),
		categoryNames: z.array(z.string()),
		items: z.array(
			z.object({
				categoryName: z.string(),
				documents: z.array(
					z.object({
						id: z.string(),
						issuerName: z.string().nullable(),
						totalAmount: z.string().nullable(),
					}),
				),
			}),
		),
	}),
});

export type HomeSummary = z.infer<typeof HomeSummarySchema>;

const summaryMemory = new Map<string, HomeSummary | undefined>();

function homeSummaryCacheKey(userId: string, month: string): string {
	return `user_${userId}_home_summary_${month}`;
}

export function forgetHomeSummaryMemory(userId: string): void {
	const prefix = `user_${userId}_home_summary_`;
	for (const key of summaryMemory.keys()) {
		if (key.startsWith(prefix)) summaryMemory.delete(key);
	}
}

export function writeCachedHomeSummary(userId: string, month: string, summary: HomeSummary): void {
	const key = homeSummaryCacheKey(userId, month);
	summaryMemory.set(key, summary);
	getAppStorage().set(key, JSON.stringify(summary));
}

export function readCachedHomeSummary(userId: string, month: string): HomeSummary | undefined {
	const key = homeSummaryCacheKey(userId, month);
	if (summaryMemory.has(key)) return summaryMemory.get(key);
	const raw = getAppStorage().getString(key);
	if (!raw) {
		summaryMemory.set(key, undefined);
		return undefined;
	}
	try {
		const parsed = HomeSummarySchema.safeParse(JSON.parse(raw));
		const value = parsed.success ? parsed.data : undefined;
		summaryMemory.set(key, value);
		return value;
	} catch {
		summaryMemory.set(key, undefined);
		return undefined;
	}
}

export async function loadHomeSummary(
	userId: string,
	month: string,
	fetchSummary: (month: string) => Promise<HomeSummary>,
	signal?: AbortSignal,
): Promise<HomeSummary> {
	try {
		const summary = await fetchSummary(month);
		if (!signal?.aborted) writeCachedHomeSummary(userId, month, summary);
		return summary;
	} catch (error) {
		const cached = readCachedHomeSummary(userId, month);
		if (cached) return cached;
		throw error;
	}
}

const limaDayFormat = new Intl.DateTimeFormat("en-CA", {
	timeZone: "America/Lima",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

export function formatLimaDay(date: Date): string {
	return limaDayFormat.format(date);
}

export function currentLimaMonth(now = new Date()): string {
	return formatLimaDay(now).slice(0, 7);
}
