import { z } from 'zod';

export const receiptSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0;
  }, 'El monto debe ser un número válido'),
  receiptType: z.enum(['boleta', 'factura'], {
    required_error: 'Debes seleccionar un tipo de comprobante',
  }),
  isExpense: z.boolean(),
  ruc: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 11,
      'El RUC debe tener exactamente 11 dígitos',
    ),
  businessName: z.string(),
  receiptNumber: z.string(),
  description: z.string(),
});

export type ReceiptSchema = z.infer<typeof receiptSchema>;
