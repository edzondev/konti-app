import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./ocr-client.js";

const BOLETA = `![img-0.jpeg](img-0.jpeg)

POLLERIA LA BRASA S.A.C.

RUC: 20543722309

BOLETA DE VENTA ELECTRONICA

B001-105975

Fecha de Emision: 21/08/2026

| Descripcion | Cant. | P.Unit | Total |
| --- | --- | --- | --- |
| POLLO BRASA | 1.00 | 45.90 | 45.90 |

OP. GRAVADA 38.90
IGV 7.00
IMPORTE TOTAL S/ 45.90
`;

describe("parseMarkdown", () => {
	it("ignora la imagen de Mistral, lee el emisor y no toma la cantidad 1.00 como total", () => {
		expect(parseMarkdown(BOLETA)).toEqual({
			documentType: "boleta",
			issuerName: "POLLERIA LA BRASA S.A.C.",
			issuerTaxId: "20543722309",
			issueDate: "2026-08-21",
			documentNumber: "B001-105975",
			currencyCode: "PEN",
			totalAmount: "45.90",
			igvAmount: "7.00",
		});
	});

	it("toma el importe cuando el total está en la línea siguiente", () => {
		const result = parseMarkdown("COMERCIO SAC\nRUC 20543722309\nIMPORTE TOTAL\nS/ 54.16");
		expect(result.totalAmount).toBe("54.16");
		expect(result.issuerName).toBe("COMERCIO SAC");
	});

	it("reconoce factura", () => {
		const result = parseMarkdown("ESTUDIO LEGAL SAC\nFACTURA ELECTRONICA\nTotal 20.00");
		expect(result.documentType).toBe("factura");
		expect(result.totalAmount).toBe("20.00");
	});

	it("lee el total en la fila de tabla que sigue a la etiqueta", () => {
		const result = parseMarkdown("COMERCIO SAC\nIMPORTE TOTAL\n\n| S/ 54.16 |");
		expect(result.totalAmount).toBe("54.16");
	});

	it("si no hay total etiquetado, usa el monto mayor y no la cantidad 1.00", () => {
		const result = parseMarkdown(`POLLERIA LA BRASA S.A.C.
RUC: 20543722309
BOLETA DE VENTA ELECTRONICA
| Descripcion | Cant. | P.Unit | Total |
| POLLO BRASA | 1.00 | 12.00 | 12.00 |
IGV 1.83`);
		expect(result.totalAmount).toBe("12.00");
		expect(result.igvAmount).toBe("1.83");
	});

	it("prefiere el total etiquetado aunque haya un monto mayor", () => {
		expect(parseMarkdown("SUBTOTAL 80.00\nDESCUENTO 20.00\nTOTAL 60.00").totalAmount).toBe("60.00");
	});
});
