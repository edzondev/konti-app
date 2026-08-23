import { z } from "zod";

export const openAttentionQuerySchema = z.object({
	status: z.literal("open").default("open"),
	limit: z.coerce.number().int().min(1).max(20).default(20),
});
