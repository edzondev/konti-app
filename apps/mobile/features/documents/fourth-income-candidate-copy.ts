import type { FourthIncomeCandidate } from "./types";

export type FourthIncomeCandidateCopy = {
	canDecide: boolean;
	title: string;
	description: string;
	issueDateLabel: string;
	paymentDateLabel: string;
};

export function fourthIncomeCandidateCopy(
	candidate: FourthIncomeCandidate,
): FourthIncomeCandidateCopy {
	const base = {
		issueDateLabel: candidate.issueDate
			? `Emitido: ${candidate.issueDate}`
			: "Fecha de emisión: no disponible",
		paymentDateLabel: candidate.paymentDate
			? `Cobrado: ${candidate.paymentDate}`
			: "Fecha de cobro: por completar",
	};

	if (candidate.eligibility === "unsupported_currency") {
		return {
			...base,
			canDecide: false,
			title: "Moneda aún no soportada",
			description: "Este vertical solo registra ingresos cobrados en soles.",
		};
	}

	if (candidate.eligibility === "already_decided") {
		return {
			...base,
			canDecide: false,
			title: "Recibo ya revisado",
			description: "La decisión sobre este RHE ya fue registrada.",
		};
	}

	if (candidate.warnings.includes("document_not_ready")) {
		return {
			...base,
			canDecide: false,
			title: "Recibo todavía en proceso",
			description: "Espera a que termine la lectura antes de registrarlo.",
		};
	}

	const missing: string[] = [];
	if (candidate.warnings.includes("missing_payment_date")) missing.push("la fecha de cobro");
	if (candidate.warnings.includes("missing_gross_amount")) missing.push("el importe bruto");
	if (candidate.warnings.includes("missing_withholding_amount")) missing.push("la retención");

	return {
		...base,
		canDecide: true,
		title: "¿Este recibo corresponde a un ingreso tuyo?",
		description:
			missing.length > 0
				? `Podrás completar ${missing.join(", ")} antes de registrarlo.`
				: "Revisa la fecha de cobro y los importes antes de registrarlo.",
	};
}
