import * as v from "valibot";

import { apiFetch } from "@/core/api-fetch";

export const DeductiblesYearSchema = v.object({
	year: v.number(),
	totalAmount: v.number(),
	documentCount: v.number(),
	categories: v.array(
		v.object({
			name: v.string(),
			amount: v.number(),
		}),
	),
	uit: v.number(),
	topAmount: v.number(),
	restaurantAmount: v.number(),
});

export type DeductiblesYear = v.InferOutput<typeof DeductiblesYearSchema>;

const limaYearFormat = new Intl.DateTimeFormat("en-CA", {
	timeZone: "America/Lima",
	year: "numeric",
});

export function currentLimaYear(now = new Date()): number {
	return Number(limaYearFormat.format(now));
}

export async function fetchDeductiblesYear(year: number): Promise<DeductiblesYear> {
	const raw = await apiFetch<unknown>(`/documents/deductibles/year?year=${year}`);
	return v.parse(DeductiblesYearSchema, raw);
}
