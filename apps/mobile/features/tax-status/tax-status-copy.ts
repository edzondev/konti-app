import { compareMoney, formatPen } from "../tax-income/money";
import {
	type FourthCategory2026Output,
	isWorkIncomeOutput,
	type MonthlyApplicablePeriod,
	type TaxEvaluationOutput,
	type WorkIncome2026Output,
} from "./types";

type FourthBreakdownInput = Pick<
	FourthCategory2026Output,
	"automaticDeduction20" | "netFourthIncome" | "sevenUitDeduction" | "preliminaryTaxableWorkIncome"
>;

export function taxEstimateBreakdown(output: TaxEvaluationOutput | FourthBreakdownInput) {
	if ("netTaxableWorkIncome" in output) {
		return [
			{ label: "Ingresos ordinarios de cuarta", value: output.grossOrdinaryFourthIncome },
			{ label: "Deducción automática 20%", value: output.automaticDeduction20 },
			{ label: "Ingresos especiales de cuarta", value: output.grossSpecialFourthIncome },
			{ label: "Renta neta de cuarta", value: output.netFourthIncome },
			{ label: "Ingresos de quinta", value: output.grossFifthIncome },
			{ label: "Renta del trabajo combinada", value: output.combinedNetWorkIncome },
			{ label: "Deducción 7 UIT", value: output.sevenUitDeduction },
			{ label: "Deducciones adicionales aplicadas", value: output.appliedAdditionalDeduction },
			{ label: "Renta neta imponible", value: output.netTaxableWorkIncome },
		] as const;
	}

	return [
		{ label: "Deducción automática 20%", value: output.automaticDeduction20 },
		{ label: "Renta neta de cuarta", value: output.netFourthIncome },
		{ label: "Deducción 7 UIT", value: output.sevenUitDeduction },
		{ label: "Renta preliminar imponible", value: output.preliminaryTaxableWorkIncome },
	] as const;
}

export function additionalDeductionBreakdownRows(
	output: Pick<
		WorkIncome2026Output["additionalDeductions"],
		"includedAdditionalDeduction" | "potentialAmountBeforeCap" | "capPen"
	>,
) {
	return [
		{ label: "Incluido con tus datos registrados", value: output.includedAdditionalDeduction },
		{ label: "Aún por revisar", value: output.potentialAmountBeforeCap },
		{ label: "Límite conjunto de 3 UIT", value: output.capPen },
	] as const;
}

export function taxEstimateHeadline(output: TaxEvaluationOutput) {
	return isWorkIncomeOutput(output)
		? { label: "Renta neta imponible registrada", value: output.netTaxableWorkIncome }
		: { label: "Total de ingresos de cuarta", value: output.grossFourthIncome };
}

export function taxEstimateCreditRows(output: TaxEvaluationOutput) {
	return isWorkIncomeOutput(output)
		? [
				{ label: "Impuesto calculado antes de créditos", value: output.calculatedTaxBeforeCredits },
				{ label: "Retenciones y pagos registrados", value: output.registeredCredits },
			]
		: [
				{
					label: "Impuesto calculado antes de deducciones adicionales",
					value: output.calculatedTaxBeforeAdditionalDeductions,
				},
				{ label: "Retenciones registradas", value: output.registeredWithholdings },
			];
}

export function taxEstimateDifference(output: TaxEvaluationOutput): string {
	return isWorkIncomeOutput(output)
		? output.differenceAfterRegisteredCredits
		: output.differenceAfterRegisteredWithholdings;
}

const MONTH_NAMES = [
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

function joinNaturalLanguage(values: readonly string[]): string {
	if (values.length <= 1) return values[0] ?? "";
	return `${values.slice(0, -1).join(", ")} y ${values.at(-1)}`;
}

export function employmentCoverageCopy(
	output: Pick<WorkIncome2026Output, "hasMultipleEmployers" | "missingEmploymentMonths">,
): string[] {
	const messages: string[] = [];
	if (output.hasMultipleEmployers) {
		messages.push("Registraste ingresos de más de una empresa. Revisa que no se repitan periodos.");
	}
	if (output.missingEmploymentMonths.length > 0) {
		const names = output.missingEmploymentMonths.map((month) => {
			const index = Number(month.slice(5, 7)) - 1;
			return MONTH_NAMES[index] ?? month;
		});
		messages.push(`Faltan ${joinNaturalLanguage(names)}. No los proyectamos ni asumimos ingresos.`);
	}
	return messages;
}

type FourthIncomeSummaryInput = Pick<
	FourthCategory2026Output,
	"grossFourthIncome" | "grossOrdinaryFourthIncome" | "grossSpecialFourthIncome"
>;

export function fourthIncomeSummaryRows(output: FourthIncomeSummaryInput) {
	return [
		{
			label: "Servicios de cuarta",
			value: output.grossOrdinaryFourthIncome ?? output.grossFourthIncome,
		},
		{
			label: "Cargos especiales de cuarta",
			value: output.grossSpecialFourthIncome ?? "0.00",
		},
	] as const;
}

export function differenceCopy(difference: string): string {
	const comparison = compareMoney(difference, "0.00");
	if (comparison === 0) return "La estimación coincide con los créditos registrados.";

	if (comparison === 1) {
		return `La estimación supera los créditos registrados por ${formatPen(difference)}.`;
	}

	return `Los créditos registrados superan la estimación por ${formatPen(difference.slice(1))}.`;
}

type TaxCoverage = WorkIncome2026Output["coverage"];

const COVERAGE_ROW_COPY = {
	incomeCoverage: {
		complete: "Ingresos: registraste todos los periodos esperados",
		partial: "Ingresos: todavía faltan datos",
		unknown: "Ingresos: aún no podemos medir qué falta",
	},
	deductionCoverage: {
		complete: "Gastos deducibles: registraste toda la información esperada",
		partial: "Gastos deducibles: todavía faltan revisiones",
		unknown: "Gastos deducibles: aún no sabemos si registraste todos",
	},
	monthlyCoverage: {
		complete: "Meses de cuarta: registraste las revisiones esperadas",
		partial: "Meses de cuarta: todavía faltan revisiones",
		unknown: "Meses de cuarta: todavía faltan revisiones",
		not_applicable: "Meses de cuarta: no aplica a tu tipo de ingresos",
	},
} as const;

const EXCLUDED_FACTOR_COPY: Readonly<Record<string, string>> = {
	foreign_source_income: "Esta estimación no incluye ingresos obtenidos fuera del Perú.",
	prior_year_credit_balance: "No incluye saldos a favor de años anteriores.",
	rent_attribution: "Hay información de alquileres cuya atribución todavía debe revisarse.",
	other_annual_credit: "No incluye otros créditos de la declaración anual.",
	annual_filing_obligation_not_determined:
		"Konti todavía no determina si estás obligado a presentar la declaración anual.",
	known_unregistered_information: "Indicastes que todavía hay información que no registraste.",
};

export function taxCoverageCopy(coverage: TaxCoverage) {
	const complete =
		coverage.incomeCoverage === "complete" &&
		coverage.deductionCoverage === "complete" &&
		(coverage.monthlyCoverage === "complete" || coverage.monthlyCoverage === "not_applicable") &&
		coverage.excludedFactors.length === 0;

	return {
		headline: complete ? "Cobertura registrada" : "Estimación parcial",
		rows: [
			COVERAGE_ROW_COPY.incomeCoverage[coverage.incomeCoverage],
			COVERAGE_ROW_COPY.deductionCoverage[coverage.deductionCoverage],
			COVERAGE_ROW_COPY.monthlyCoverage[coverage.monthlyCoverage],
		],
		exclusions: coverage.excludedFactors.map(
			(factor) => EXCLUDED_FACTOR_COPY[factor] ?? "Hay información fuera de esta estimación.",
		),
	};
}

const MONTHLY_STATUS_COPY: Readonly<Record<MonthlyApplicablePeriod["status"], string>> = {
	not_reviewed: "Falta revisar",
	insufficient_data: "Faltan datos",
	no_action_detected: "No detectamos una acción con lo registrado",
	action_likely_required: "Podría requerir una acción",
	awaiting_user_confirmation: "Falta tu confirmación",
	user_recorded_complete: "Información registrada",
};

export function monthlyPeriodRows(periods: readonly MonthlyApplicablePeriod[]) {
	return periods.map(({ period, status }) => {
		const monthIndex = Number(period.slice(5, 7)) - 1;
		const month = MONTH_NAMES[monthIndex] ?? period;
		return {
			period: month.charAt(0).toUpperCase() + month.slice(1),
			status: MONTHLY_STATUS_COPY[status],
		};
	});
}
