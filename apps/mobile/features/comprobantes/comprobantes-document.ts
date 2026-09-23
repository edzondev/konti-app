import { z } from "zod";

export const DocumentSchema = z.object({
	status: z.enum(["pending", "ready", "failed"]),
	source: z.enum(["camera", "gallery", "share"]),
	documentType: z.enum(["boleta", "factura", "recibo_honorarios", "ticket", "unknown"]),
	category: z.enum([
		"restaurantes",
		"supermercado",
		"transporte",
		"servicios_medicos",
		"servicios_profesionales",
		"hogar_servicios",
		"entretenimiento",
		"educacion",
		"otros",
	]),
	id: z.string(),
	issuerName: z.string().nullable(),
	issuerTaxId: z.string().nullable(),
	issueDate: z.string().nullable(),
	documentNumber: z.string().nullable(),
	currencyCode: z.string().nullable(),
	totalAmount: z.string().nullable(),
	igvAmount: z.string().nullable(),
	createdAt: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;
