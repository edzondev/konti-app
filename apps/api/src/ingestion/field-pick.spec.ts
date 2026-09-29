import { describe, expect, it } from "vitest";
import { type FieldAnswers, scanMarkdown } from "./field-pick.js";

const MARKDOWN = "SUBTOTAL 80.00\nDESCUENTO 20.00\nIGV 10.80\nTOTAL 60.00";

function pickFields(markdown: string, answers: FieldAnswers) {
	return scanMarkdown(markdown).pick(answers);
}

function questionsFor(markdown: string) {
	return scanMarkdown(markdown).questions;
}

describe("pickFields", () => {
	it("copia el monto elegido y no el mayor", () => {
		const result = pickFields(MARKDOWN, {
			total: { choice: "60.00", confidence: 0.9 },
		});
		expect(result.confident).toBe(true);
		expect(result.extracted.totalAmount).toBe("60.00");
		expect(questionsFor(MARKDOWN)?.total?.criteria).toMatchObject({
			"80.00": null,
			"60.00": null,
		});
	});

	it("manda a revisión si el total no está o la confianza es baja", () => {
		expect(pickFields(MARKDOWN, { total: { choice: "none", confidence: 0.95 } }).confident).toBe(
			false,
		);
		expect(pickFields(MARKDOWN, { total: { choice: "60.00", confidence: 0.4 } }).confident).toBe(
			false,
		);
		expect(pickFields("sin montos", {}).confident).toBe(false);
		expect(questionsFor("sin montos")).toBeNull();
	});

	it("prioriza montos del final cuando hay muchos candidatos", () => {
		const lines = Array.from({ length: 60 }, (_, i) => `ITEM ${i} ${(i + 1).toFixed(2)}`);
		lines.push("TOTAL 999.50");
		const criteria = questionsFor(lines.join("\n"))?.total?.criteria ?? {};
		expect(criteria["999.50"]).toBeNull();
		expect(Object.keys(criteria)).toHaveLength(49);
	});

	it("normaliza montos con coma decimal", () => {
		const markdown = "TOTAL 1.234,50";
		const result = pickFields(markdown, {
			total: { choice: "1.234,50", confidence: 0.95 },
		});
		expect(result.confident).toBe(true);
		expect(result.extracted.totalAmount).toBe("1234.50");
	});

	it("normaliza fecha dd/mm/yyyy a ISO", () => {
		const markdown = "Fecha 21/08/2026\nTOTAL 50.00";
		const result = pickFields(markdown, {
			total: { choice: "50.00", confidence: 0.9 },
			date: { choice: "21/08/2026", confidence: 0.9 },
		});
		expect(result.extracted.issueDate).toBe("2026-08-21");
	});

	it("copia el IGV elegido", () => {
		const result = pickFields(MARKDOWN, {
			total: { choice: "60.00", confidence: 0.9 },
			igv: { choice: "10.80", confidence: 0.85 },
		});
		expect(result.extracted.igvAmount).toBe("10.80");
	});

	it("no ofrece la imagen de Mistral como emisor", () => {
		const markdown = "![img-0.jpeg](img-0.jpeg)\nCOMERCIO SAC\nTOTAL 50.00";
		const criteria = questionsFor(markdown)?.issuer?.criteria ?? {};
		expect(criteria["COMERCIO SAC"]).toBeNull();
		expect(Object.keys(criteria).some((key) => key.includes("img-0"))).toBe(false);
	});
});
