import * as v from "valibot";

import { getAppStorage } from "@/core/storage";

export const HomeSummarySchema = v.object({
	month: v.string(),
	totalAmount: v.number(),
	documentCount: v.number(),
	processingCount: v.number(),
	insight: v.string(),
	categories: v.array(
		v.object({
			name: v.string(),
			amount: v.number(),
		}),
	),
	deductibles: v.object({
		count: v.number(),
		totalAmount: v.number(),
		categoryNames: v.array(v.string()),
		items: v.array(
			v.object({
				categoryName: v.string(),
				documents: v.array(
					v.object({
						id: v.string(),
						issuerName: v.nullable(v.string()),
						totalAmount: v.nullable(v.string()),
					}),
				),
			}),
		),
	}),
});

export type HomeSummary = v.InferOutput<typeof HomeSummarySchema>;

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
		const parsed = v.safeParse(HomeSummarySchema, JSON.parse(raw));
		const value = parsed.success ? parsed.output : undefined;
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
