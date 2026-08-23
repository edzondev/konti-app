import { formatPen } from "@/features/tax-income/money";

import type {
	MonthlyFourthActivityClassification,
	MonthlyFourthStatus,
	VerificationScope,
} from "./types";

const COVERAGE_STEP = {
	id: "coverage",
	title: "¿Ya registraste todos tus ingresos de este mes?",
	body: "Si falta un recibo o un cobro, Konti no cerrará la estimación del mes.",
} as const;
const ACTIVITY_STEP = {
	id: "activity",
	title: "¿Qué tipo de trabajo independiente hiciste este mes?",
	body: "Necesitamos distinguir los servicios comunes de algunas funciones especiales para usar el límite correcto.",
} as const;
const REMAINING_STEPS = [
	{
		id: "suspension",
		title: "¿SUNAT te autorizó a no hacer pagos mensuales?",
		body: "Esa autorización se conoce como suspensión de cuarta.",
	},
	{
		id: "filing",
		title: "¿Presentaste la declaración mensual?",
		body: "La declaración y el pago son hechos distintos, aunque los hayas hecho juntos.",
	},
	{
		id: "payment",
		title: "¿Realizaste un pago por este mes?",
		body: "Registra únicamente un pago que realmente efectuaste.",
	},
] as const;

export function monthlyReviewStepsFor(classification: MonthlyFourthActivityClassification) {
	return classification === "unknown"
		? ([COVERAGE_STEP, ACTIVITY_STEP, ...REMAINING_STEPS] as const)
		: ([COVERAGE_STEP, ...REMAINING_STEPS] as const);
}

const STATUS_COPY: Record<MonthlyFourthStatus, { title: string; body: string }> = {
	insufficient_data: {
		title: "Nos falta información de este mes.",
		body: "Revisa las preguntas pendientes antes de tomar una decisión.",
	},
	no_action_detected: {
		title: "No detectamos una acción mensual con lo registrado.",
		body: "Es una revisión de tus datos en Konti, no una validación oficial.",
	},
	action_likely_required: {
		title: "Este mes necesita tu atención.",
		body: "Es probable que tengas que declarar o registrar un pago de cuarta.",
	},
	awaiting_user_confirmation: {
		title: "Falta confirmar qué hiciste este mes.",
		body: "La declaración y el pago se registran por separado.",
	},
	user_recorded_complete: {
		title: "Registraste la información de este mes.",
		body: "Esto resume lo que registraste en Konti; no confirma el estado del mes ante SUNAT.",
	},
};

export function monthlyFourthStatusCopy(status: MonthlyFourthStatus) {
	return STATUS_COPY[status];
}

export function monthlyThresholdCopy(kind: "general" | "special", threshold: string): string {
	return kind === "special"
		? `Usamos el límite mensual de ${formatPen(threshold)} porque registraste al menos una actividad especial de cuarta.`
		: `Usamos el límite mensual de ${formatPen(threshold)} para servicios independientes comunes.`;
}

export function monthlyDifferenceCopy(value: string | null): string {
	return value === null
		? "Aún no podemos estimar la diferencia de este mes."
		: `Diferencia estimada después de las retenciones registradas: ${formatPen(value)}.`;
}

export function verificationScopeCopy(scope: VerificationScope): string {
	if (scope === "user_provided") return "Información indicada por ti";
	if (scope === "evidence_attached") return "Con evidencia adjunta";
	return "Verificado mediante una integración oficial";
}
