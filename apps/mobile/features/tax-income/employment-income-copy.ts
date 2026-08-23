import type { CalculationDisposition, EmploymentCoverageScope, TaxIncomeRecordKind } from "./types";

const MONTHS = [
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
] as const;

type EmploymentRowFacts = {
	recordKind: Extract<TaxIncomeRecordKind, "period" | "year_to_date_snapshot">;
	coverageStart: string;
	coverageEnd: string;
	payerName: string | null;
	calculationDisposition: CalculationDisposition;
	coveredByRecordId: string | null;
};

export function employmentIncomeRowCopy(facts: EmploymentRowFacts) {
	const payer = facts.payerName ?? "Todos tus empleadores";
	const periodLabel =
		facts.recordKind === "period"
			? `${capitalize(monthName(facts.coverageStart))} · ${payer}`
			: `${monthRange(facts.coverageStart, facts.coverageEnd)} · acumulado`;

	if (facts.calculationDisposition === "needs_resolution") {
		return {
			title: payer,
			periodLabel,
			statusLabel: "Revisa este cruce: no se sumará hasta que confirmes si está repetido.",
			statusTone: "primary" as const,
		};
	}
	if (facts.calculationDisposition === "excluded_by_coverage") {
		return {
			title: payer,
			periodLabel,
			statusLabel: "Ya está dentro de un acumulado; no se suma dos veces.",
			statusTone: "muted" as const,
		};
	}
	return { title: payer, periodLabel, statusLabel: null, statusTone: "muted" as const };
}

export function employmentCoverageScopeDescription(
	scope: EmploymentCoverageScope,
	payerTaxId: string | null,
): string {
	if (scope === "all_employers") {
		return "Elige esta opción solo si el reporte dice que reúne a todos tus empleadores en ese periodo.";
	}
	if (payerTaxId) {
		return "El RUC exacto de la empresa ayuda a reconocer boletas ya contenidas en un acumulado.";
	}
	return "Un nombre parecido no basta para excluir otro registro. Si se cruza con un acumulado, Konti te pedirá revisarlo.";
}

function monthName(date: string): string {
	const month = Number(date.slice(5, 7));
	return MONTHS[month - 1] ?? "periodo";
}

function monthRange(start: string, end: string): string {
	const startMonth = monthName(start);
	const endMonth = monthName(end);
	return capitalize(startMonth === endMonth ? startMonth : `${startMonth}–${endMonth}`);
}

function capitalize(value: string): string {
	return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
