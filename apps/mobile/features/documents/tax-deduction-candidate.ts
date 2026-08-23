import type { TaxDeductionCandidate } from "./types";

export function taxDeductionCandidateRoute(
	documentId: string,
	candidate: TaxDeductionCandidate,
): string {
	const params = new URLSearchParams({
		sourceDocumentId: documentId,
		category: candidate.categoryHint,
		grossAmountPen: candidate.grossAmount,
	});
	return `/tax-deduction-form?${params.toString()}`;
}

export function taxDeductionIdentityEvidenceCopy(
	evidence: TaxDeductionCandidate["consumerIdentityEvidence"],
): string {
	if (evidence === "matches") {
		return "El DNI protegido del comprobante coincide con el que registraste en Konti.";
	}
	if (evidence === "does_not_match") {
		return "El DNI protegido del comprobante no coincide. Revísalo antes de incluir el gasto.";
	}
	return "No pudimos comparar el DNI del comprobante. Podrás confirmarlo en la revisión.";
}
