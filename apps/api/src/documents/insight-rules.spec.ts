import { describe, expect, it } from "vitest";
import { generateInsight } from "./insight-rules.js";

const base = {
	monthsWithData: 2,
	currentCount: 10,
	avg: 1000,
	ratio: 1,
	categoryShares: {} as Record<string, number>,
};

describe("generateInsight", () => {
	it("primer mes sin historial", () => {
		expect(generateInsight({ ...base, monthsWithData: 0 })).toBe(
			"Tu primer mes con Konti. Estamos organizando todo.",
		);
	});

	it("pocos comprobantes", () => {
		expect(generateInsight({ ...base, currentCount: 4 })).toBe(
			"Este mes tienes pocos comprobantes. Konti sigue ordenando.",
		);
	});

	it("ratio bajo extremo", () => {
		expect(generateInsight({ ...base, ratio: 0.4 })).toBe(
			"Es tu mes más tranquilo en un tiempo.",
		);
	});

	it("ratio bajo moderado", () => {
		expect(generateInsight({ ...base, ratio: 0.7 })).toBe(
			"Gastaste menos que tu promedio. Buen mes.",
		);
	});

	it("ratio alto moderado", () => {
		expect(generateInsight({ ...base, ratio: 1.3 })).toBe(
			"Este mes gastaste un poco más que de costumbre.",
		);
	});

	it("ratio alto extremo", () => {
		expect(generateInsight({ ...base, ratio: 1.6 })).toBe(
			"Este mes gastaste bastante más que tu promedio.",
		);
	});

	it("ratio normal con categoría dominante", () => {
		expect(
			generateInsight({
				...base,
				ratio: 1,
				categoryShares: { restaurantes: 0.35 },
			}),
		).toBe("Este mes se fue bastante en restaurantes.");
	});

	it("ratio normal sin categoría dominante → fallback", () => {
		expect(
			generateInsight({
				...base,
				ratio: 1,
				categoryShares: { restaurantes: 0.1 },
			}),
		).toBe("Nada fuera de lo normal este mes.");
	});
});
