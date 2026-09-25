import * as v from "valibot";
import type { ExtractedDocument } from "./ingestion.types.js";
import {
	AmountCandidateSchema,
	IsoDateSchema,
	normalizeAmountCandidate,
	RucSchema,
} from "./schemas.js";

/**
 * Parser heurístico sobre texto libre (p. ej. OCR on-device futuro).
 * Requiere RUC + fecha + total para considerarse válido.
 */
export function parseLocalText(text: string): ExtractedDocument | null {
	const trimmed = text.trim();
	if (!trimmed) return null;

	const rucMatch = trimmed.match(/\b(10|15|17|20)\d{9}\b/);
	const dateMatch = trimmed.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
	const totalMatch = trimmed.match(/total[^\d]*(\d+[.,]\d{2})/i);
	const igvMatch = trimmed.match(/igv[^\d]*(\d+[.,]\d{2})/i);

	if (!rucMatch?.[0] || !dateMatch?.[1] || !dateMatch[2] || !dateMatch[3] || !totalMatch?.[1]) {
		return null;
	}

	const issueDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
	if (!v.is(IsoDateSchema, issueDate)) return null;
	if (!v.is(RucSchema, rucMatch[0])) return null;
	if (!v.is(AmountCandidateSchema, totalMatch[1])) return null;

	const igvRaw = igvMatch?.[1];
	const igvAmount =
		igvRaw && v.is(AmountCandidateSchema, igvRaw) ? normalizeAmountCandidate(igvRaw) : null;

	return {
		documentType: "unknown",
		issuerName: null,
		issuerTaxId: rucMatch[0],
		issueDate,
		documentNumber: null,
		currencyCode: "PEN",
		totalAmount: normalizeAmountCandidate(totalMatch[1]),
		igvAmount,
	};
}
