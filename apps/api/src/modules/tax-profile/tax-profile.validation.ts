import { z } from "zod";

export const updateTaxProfileSchema = z
	.object({
		incomeMode: z.enum(["employment", "independent", "mixed"]),
		trackDeductibles: z.boolean(),
	})
	.strict();

export type UpdateTaxProfileInput = z.infer<typeof updateTaxProfileSchema>;
