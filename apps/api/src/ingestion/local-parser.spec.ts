import { describe, expect, it } from "vitest";
import { parseLocalText } from "./local-parser.js";

describe("parseLocalText", () => {
	it("extrae RUC, fecha y total de texto libre", () => {
		const result = parseLocalText(
			"Comercio SAC\nRUC 20543722309\nFecha 21/08/2026\nIGV 18.56\nTotal 111.35",
		);

		expect(result).toEqual({
			documentType: "unknown",
			issuerName: null,
			issuerTaxId: "20543722309",
			issueDate: "2026-08-21",
			documentNumber: null,
			currencyCode: "PEN",
			totalAmount: "111.35",
			igvAmount: "18.56",
		});
	});

	it("devuelve null con texto basura", () => {
		expect(parseLocalText("texto basura")).toBeNull();
		expect(parseLocalText("")).toBeNull();
	});

	it("devuelve null si falta el total", () => {
		expect(parseLocalText("RUC 20543722309 Fecha 21/08/2026")).toBeNull();
	});
});
