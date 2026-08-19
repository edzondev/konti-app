import type { IncomeMode } from "./types";

export type IncomeChoice = "planilla" | "honorarios";

export function incomeChoicesToMode(choices: readonly IncomeChoice[]): IncomeMode | null {
	const unique = new Set(choices);
	const hasPlanilla = unique.has("planilla");
	const hasHonorarios = unique.has("honorarios");

	if (hasPlanilla && hasHonorarios) {
		return "mixed";
	}

	if (hasPlanilla) {
		return "employment";
	}

	if (hasHonorarios) {
		return "independent";
	}

	return null;
}
