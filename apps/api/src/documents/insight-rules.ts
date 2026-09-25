import type { Category } from "../ingestion/category-map.js";

export interface InsightInput {
	monthsWithData: number;
	currentCount: number;
	/** Promedio de totales de hasta 3 meses previos con datos; 0 si no hay histórico. */
	avg: number;
	/** totalActual / avg; 0 si avg es 0. */
	ratio: number;
	/** Share 0..1 por categoría sobre el total del mes actual. */
	categoryShares: Partial<Record<Category, number>>;
}

/**
 * Reglas en orden de prioridad: la primera que matchea gana.
 *
 * Bandas de total solo cuando el gasto es inusual (fuera de 0.8–1.2 vs promedio).
 * En rango normal → mirar categorías; si ninguna domina → fallback.
 */
export function generateInsight(input: InsightInput): string {
	const { monthsWithData, currentCount, avg, ratio, categoryShares } = input;

	if (monthsWithData === 0) {
		return "Tu primer mes con Konti. Estamos organizando todo.";
	}

	if (currentCount < 5) {
		return "Este mes tienes pocos comprobantes. Konti sigue ordenando.";
	}

	if (avg > 0) {
		if (ratio < 0.5) return "Es tu mes más tranquilo en un tiempo.";
		if (ratio < 0.8) return "Gastaste menos que tu promedio. Buen mes.";
		if (ratio > 1.5) return "Este mes gastaste bastante más que tu promedio.";
		if (ratio > 1.2) return "Este mes gastaste un poco más que de costumbre.";
		// 0.8–1.2: total normal → categorías
	}

	const restaurantes = categoryShares.restaurantes ?? 0;
	const supermercado = categoryShares.supermercado ?? 0;
	const medicos = categoryShares.servicios_medicos ?? 0;
	const profesionales = categoryShares.servicios_profesionales ?? 0;
	const transporte = categoryShares.transporte ?? 0;

	if (restaurantes > 0.3) return "Este mes se fue bastante en restaurantes.";
	if (supermercado > 0.4) return "El supermercado fue tu gasto principal este mes.";
	if (medicos > 0.2) return "Tuviste varios gastos médicos este mes.";
	if (profesionales > 0.3) return "Este mes hiciste varios pagos profesionales.";
	if (transporte > 0.2) return "Este mes te movilizaste bastante.";

	return "Nada fuera de lo normal este mes.";
}
