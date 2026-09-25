import * as v from "valibot";

/**
 * Fecha ISO `yyyy-mm-dd` con validez de calendario real.
 *
 * `v.isoDate()` solo valida el formato (acepta p. ej. "2023-06-31"), así que
 * además hacemos un round-trip en UTC para confirmar que la fecha exista.
 */
export const IsoDateSchema = v.pipe(
	v.string(),
	v.isoDate("Formato de fecha inválido"),
	v.check((value) => {
		const timestamp = Date.parse(`${value}T00:00:00Z`);
		if (Number.isNaN(timestamp)) return false;
		return new Date(timestamp).toISOString().slice(0, 10) === value;
	}, "La fecha no existe en el calendario"),
);

/** RUC peruano: empieza en 10, 15, 17 o 20 y tiene 11 dígitos. */
export const RucSchema = v.pipe(v.string(), v.regex(/^(10|15|17|20)\d{9}$/));

/** Monto normalizado con punto decimal (API / PATCH). */
export const AmountSchema = v.pipe(v.string(), v.regex(/^\d+(\.\d{1,2})?$/));

/** Candidato de monto tal como aparece en texto OCR/local (coma o punto). */
export const AmountCandidateSchema = v.pipe(v.string(), v.regex(/^\d+[.,]\d{2}$/));

/** Serie-correlativo típico de comprobante electrónico. */
export const DocumentNumberSchema = v.pipe(v.string(), v.regex(/^[BFE]\d{3}-\d{1,8}$/));

export function normalizeAmountCandidate(raw: string): string {
	return raw.replace(",", ".");
}
