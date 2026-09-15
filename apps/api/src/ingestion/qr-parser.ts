import * as v from "valibot";
import type { DocumentType, ExtractedDocument } from "./ingestion.types.js";
import { IsoDateSchema } from "./schemas.js";

const DOC_TYPE_MAP: Record<string, DocumentType> = {
	"01": "factura",
	"03": "boleta",
	"07": "factura",
	"08": "factura",
	"12": "ticket",
	"20": "recibo_honorarios",
	"40": "recibo_honorarios",
	R1: "recibo_honorarios",
	R7: "recibo_honorarios",
	R8: "recibo_honorarios",
};

const RucSchema = v.pipe(v.string(), v.regex(/^\d{11}$/));
const SeriesSchema = v.pipe(v.string(), v.regex(/^([A-Z]\d{3}|[A-Z]{2}\d{2})$/)); // F001, FF01, B001, E001, T001, etc.
const CorrelativeSchema = v.pipe(v.string(), v.regex(/^\d{1,8}$/));
// montos SUNAT siempre con 2 decimales: descarta RUC, correlativo y doc. del adquiriente
const AmountSchema = v.pipe(v.string(), v.regex(/^\d+\.\d{2}$/));

export function parseQrPayload(raw: string): ExtractedDocument | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const parts = trimmed.includes("|")
		? trimmed
				.split("|")
				.map((p) => p.trim())
				.filter(Boolean)
		: [trimmed];

	const ruc = parts.find((p) => v.is(RucSchema, p)) ?? null;
	const dateRaw = parts.find((p) => v.is(IsoDateSchema, p)) ?? null;

	// Tipo: código (2 dígitos o alfanumérico tipo R1/R7/R8), va justo después del RUC
	const rucIndex = ruc ? parts.indexOf(ruc) : -1;
	const typeCode = rucIndex >= 0 ? parts[rucIndex + 1] : null;
	const documentType = typeCode && DOC_TYPE_MAP[typeCode] ? DOC_TYPE_MAP[typeCode] : "unknown";

	// Serie: letra(s) + dígitos, 4 caracteres en total
	const series = parts.find((p) => v.is(SeriesSchema, p)) ?? null;

	// Correlativo: número justo después de la serie
	const seriesIndex = series ? parts.indexOf(series) : -1;
	const correlativeCandidate = seriesIndex >= 0 ? parts[seriesIndex + 1] : null;
	const correlative =
		correlativeCandidate && v.is(CorrelativeSchema, correlativeCandidate)
			? correlativeCandidate
			: null;

	// Monto total: entre los valores con 2 decimales (IGV, total), el total es el mayor
	const amounts = parts
		.filter((p) => v.is(AmountSchema, p))
		.map(Number)
		.sort((a, b) => b - a);
	const topAmount = amounts[0];
	const topIgv = amounts[1]?.toFixed(2);
	const total = topAmount !== undefined ? topAmount.toFixed(2) : null;
	const igv = topIgv ?? null;

	if (!ruc || !dateRaw) return null;

	return {
		documentType,
		issuerName: null,
		issuerTaxId: ruc,
		issueDate: dateRaw,
		documentNumber: series && correlative ? `${series}-${correlative}` : null,
		currencyCode: "PEN",
		totalAmount: total,
		igvAmount: igv,
	};
}
