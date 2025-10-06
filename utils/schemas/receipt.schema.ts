import { z } from "zod";

export const receiptSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, "El monto debe ser un número válido"),
  isExpense: z.boolean(),
  ruc: z.string(),
  businessName: z.string(), //Razon social
  receiptNumber: z.string(),
  description: z.string(),
});

export type ReceiptSchema = z.infer<typeof receiptSchema>;
