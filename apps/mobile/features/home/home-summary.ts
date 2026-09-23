import { z } from "zod";

export const HomeSummarySchema = z.object({
	month: z.string(),
	totalAmount: z.number(),
	documentCount: z.number(),
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

export function currentLimaMonth(now = new Date()): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	})
		.format(now)
		.slice(0, 7);
}
