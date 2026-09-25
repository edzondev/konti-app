import { describe, expect, it } from "vitest";
import { categorizeByName } from "./category-map.js";

describe("categorizeByName", () => {
	it("matchea la clave con tilde contra el emisor ya normalizado", () => {
		expect(categorizeByName("el senor de huanca")).toBe("restaurantes");
	});

	it("no matchea win dentro de edwin", () => {
		expect(categorizeByName("edwin")).toBe("otros");
	});

	it("matchea win como palabra completa", () => {
		expect(categorizeByName("Win")).toBe("hogar_servicios");
	});

	it("la clave más larga gana", () => {
		expect(categorizeByName("Pardos Chicken Miraflores")).toBe("restaurantes");
		expect(categorizeByName("Universidad de Lima")).toBe("educacion");
	});

	it("mantiene claves genéricas solo como palabra completa", () => {
		expect(categorizeByName("Universidad Nacional")).toBe("educacion");
		expect(categorizeByName("Laboratorio Clinico")).toBe("servicios_medicos");
		expect(categorizeByName("Central Restaurante")).toBe("restaurantes");
		expect(categorizeByName("Metro")).toBe("supermercado");
		expect(categorizeByName("Botica")).toBe("servicios_medicos");
	});
});
