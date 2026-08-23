import type { EmploymentIncomeCandidate } from "./types";

export function employmentIncomeCandidateCopy(candidate: EmploymentIncomeCandidate) {
	const title =
		candidate.recordKind === "year_to_date_snapshot"
			? "Acumulado de planilla por revisar"
			: "Boleta de pago por revisar";
	const missingCoverage =
		candidate.warnings.includes("missing_coverage_start") ||
		candidate.warnings.includes("missing_coverage_end");
	const invalidCoverage = candidate.warnings.some((warning) =>
		[
			"invalid_coverage_start",
			"invalid_coverage_end",
			"invalid_coverage_range",
			"invalid_coverage_combination",
		].includes(warning),
	);
	const missingLabel = invalidCoverage
		? "El periodo detectado no es válido. Revisa las fechas y el tipo de documento."
		: missingCoverage
			? "Falta indicar desde qué fecha hasta qué fecha cubre el documento."
			: candidate.warnings.includes("missing_coverage_scope")
				? "Falta confirmar si reúne una empresa o a todos tus empleadores."
				: candidate.warnings.includes("missing_payer")
					? "Falta identificar la empresa para este registro."
					: candidate.warnings.includes("missing_gross_amount") ||
							candidate.warnings.includes("missing_withheld_tax_amount") ||
							candidate.warnings.includes("invalid_gross_amount") ||
							candidate.warnings.includes("invalid_withheld_tax_amount")
						? "Falta revisar los importes de ingreso o retención."
						: candidate.warnings.includes("invalid_payer_tax_id")
							? "El RUC detectado no tiene 11 dígitos. Revísalo antes de registrar."
							: null;
	const documentNotReady = candidate.warnings.includes("document_not_ready");
	const terminalLabel = documentNotReady
		? "Terminaremos de leer el documento antes de habilitar la revisión."
		: candidate.eligibility === "unsupported_currency"
			? "Este documento usa una moneda que Konti todavía no admite para este cálculo."
			: candidate.eligibility === "already_decided"
				? "Este documento ya fue decidido."
				: null;

	return {
		title,
		description:
			"Lo leímos de este documento. Revisa el periodo, la empresa y los importes antes de usarlo en tu estimación.",
		verificationLabel: "Evidencia OCR sin verificar; tú confirmarás los datos.",
		missingLabel,
		terminalLabel,
		canReview:
			!documentNotReady &&
			candidate.eligibility !== "already_decided" &&
			candidate.eligibility !== "unsupported_currency",
	};
}
