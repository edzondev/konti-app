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
