import { z } from "zod";

import { apiFetch } from "@/core/api-fetch";

export const DeductiblesYearSchema = z.object({
	year: z.number(),
	totalAmount: z.number(),
	documentCount: z.number(),
	categories: z.array(
		z.object({
			name: z.string(),
			amount: z.number(),
		}),
	),
	uit: z.number(),
	topAmount: z.number(),
});

export type DeductiblesYear = z.infer<typeof DeductiblesYearSchema>;

export function currentLimaYear(now = new Date()): number {
	return Number(
		new Intl.DateTimeFormat("en-CA", {
			timeZone: "America/Lima",
			year: "numeric",
		}).format(now),
	);
}

export async function fetchDeductiblesYear(year: number): Promise<DeductiblesYear> {
	const raw = await apiFetch<unknown>(`/documents/deductibles/year?year=${year}`);
	return DeductiblesYearSchema.parse(raw);
}
