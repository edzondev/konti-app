import type { FourthIncomeCandidate } from "./types";

export type FourthIncomeCandidateCopy = {
	canDecide: boolean;
	title: string;
	description: string;
	issueDateLabel: string;
	dueDateLabel: string;
	paymentTermsLabel: string;
	documentPaymentEvidenceLabel: string;
	priorDecisionLabel: string | null;
	selectedDecision: "paid" | "unpaid" | "unsure" | null;
	decisions: readonly {
		decision: "paid" | "unpaid" | "unsure";
		label: string;
	}[];
};

const DECISIONS = [
	{ decision: "paid", label: "Sí, ya me pagaron" },
	{ decision: "unpaid", label: "Todavía no me pagan" },
	{ decision: "unsure", label: "No estoy seguro" },
] as const;

export function fourthIncomeCandidateCopy(
	candidate: FourthIncomeCandidate,
): FourthIncomeCandidateCopy {
	const base: Omit<FourthIncomeCandidateCopy, "canDecide" | "title" | "description"> = {
		issueDateLabel: candidate.issueDate
			? `Emitido: ${candidate.issueDate}`
			: "Fecha de emisión: no disponible",
		dueDateLabel: candidate.dueDate
			? `Vence: ${candidate.dueDate}`
			: "Fecha de vencimiento: no disponible",
		paymentTermsLabel:
			candidate.paymentTerms === "cash"
				? "Forma de pago del recibo: contado"
				: candidate.paymentTerms === "credit"
					? "Forma de pago del recibo: crédito"
					: "Forma de pago del recibo: no identificada",
		documentPaymentEvidenceLabel: candidate.documentReportedPaymentDate
			? `El documento indica un pago el ${candidate.documentReportedPaymentDate}. Confirma la fecha real.`
			: "La fecha real de cobro la confirmas tú.",
		priorDecisionLabel:
			candidate.decision === "unpaid"
				? "Indicaste que todavía no te pagan"
				: candidate.decision === "unsure"
					? "Indicaste que no estás seguro del pago"
					: candidate.decision === "activity_unsure"
						? "Falta confirmar qué tipo de actividad realizaste"
						: null,
		selectedDecision:
			candidate.decision === "unpaid" || candidate.decision === "unsure"
				? candidate.decision
				: candidate.decision === "activity_unsure"
					? "paid"
					: null,
		decisions: DECISIONS,
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
	if (candidate.warnings.includes("missing_gross_amount")) missing.push("el importe bruto");
	if (candidate.warnings.includes("missing_withholding_amount")) missing.push("la retención");

	return {
		...base,
		canDecide: true,
		title: "¿Ya te pagaron por este recibo?",
		description:
			missing.length > 0
				? `Podrás completar ${missing.join(", ")} antes de registrarlo.`
				: "Primero dinos si ya te pagaron. Si fue así, confirmarás cuándo lo cobraste.",
	};
}
