import type { DocumentListItem } from "./document";

const LIMA = "America/Lima";

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
	timeZone: LIMA,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("es-PE", {
	timeZone: LIMA,
	hour: "numeric",
	minute: "2-digit",
	hour12: true,
});

const moneyFmt = new Intl.NumberFormat("es-PE", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export const MONTH_NAMES = [
	"Enero",
	"Febrero",
	"Marzo",
	"Abril",
	"Mayo",
	"Junio",
	"Julio",
	"Agosto",
	"Septiembre",
	"Octubre",
	"Noviembre",
	"Diciembre",
] as const;

export const DOCUMENT_TYPE_OPTIONS = [
	{ value: "boleta", label: "Boleta" },
	{ value: "factura", label: "Factura" },
	{ value: "recibo_honorarios", label: "Recibo por honorarios" },
	{ value: "ticket", label: "Ticket" },
] as const;

const LABELS = {
	category: {
		restaurantes: "Restaurantes",
		supermercado: "Supermercado",
		transporte: "Transporte",
		servicios_medicos: "Servicios médicos",
		servicios_profesionales: "Servicios profesionales",
		hogar_servicios: "Hogar y servicios",
		entretenimiento: "Entretenimiento",
		educacion: "Educación",
		otros: "Otros",
	} as Record<string, string>,
	type: {
		boleta: "Boleta",
		factura: "Factura",
		recibo_honorarios: "Recibo por honorarios",
		ticket: "Ticket",
		unknown: "Sin tipo",
	} as Record<string, string>,
	source: {
		camera: "Cámara",
		gallery: "Galería",
		share: "Compartido",
	} as Record<string, string>,
};

export type PeriodKey = "hoy" | "esta_semana" | "anteriores";
export type PeriodSection = { key: PeriodKey; title: string; data: DocumentListItem[] };

export function limaYmd(date: Date): string {
	return ymdFmt.format(date);
}

export function currentLimaMonth(now = new Date()): string {
	return limaYmd(now).slice(0, 7);
}

export function parseMonth(month: string): { year: number; monthIndex0: number } {
	const [y, m] = month.split("-");
	return { year: Number(y), monthIndex0: Number(m) - 1 };
}

export function monthFromParts(year: number, monthIndex0: number): string {
	return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number): string {
	const { year, monthIndex0 } = parseMonth(month);
	const d = new Date(Date.UTC(year, monthIndex0 + delta, 1));
	return monthFromParts(d.getUTCFullYear(), d.getUTCMonth());
}

export function monthTitle(month: string): string {
	const { year, monthIndex0 } = parseMonth(month);
	return `${MONTH_NAMES[monthIndex0]} ${year}`;
}

export function formatMoney(amount: string | null | undefined): string {
	if (amount == null || amount === "") return "0.00";
	const n = Number(amount);
	return Number.isNaN(n) ? amount : moneyFmt.format(n);
}

export function formatSoles(amount: string | null | undefined): string {
	return `S/ ${formatMoney(amount)}`;
}

export function isExtractionIncomplete(doc: Pick<DocumentListItem, "totalAmount">): boolean {
	if (doc.totalAmount == null || doc.totalAmount === "") return true;
	const n = Number(doc.totalAmount);
	return Number.isNaN(n) || n <= 0;
}

export function categoryLabel(category: string): string {
	return LABELS.category[category] ?? "Sin categoría";
}

export function documentTypeLabel(type: string): string {
	return LABELS.type[type] ?? type;
}

export function sourceLabel(source: string | undefined): string {
	return source ? (LABELS.source[source] ?? source) : "—";
}

export function formatIssueDate(isoDate: string | null | undefined): string {
	if (!isoDate) return "—";
	const [y, m, d] = isoDate.slice(0, 10).split("-");
	return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

function docDay(doc: DocumentListItem): string | null {
	if (doc.issueDate) return doc.issueDate.slice(0, 10);
	if (doc.createdAt) return limaYmd(new Date(doc.createdAt));
	return null;
}

export function dayLabel(ymd: string, today: string): string {
	if (ymd === today) return "Hoy";
	const parts = ymd.split("-");
	const y = Number(parts[0]);
	const m = Number(parts[1]);
	const d = Number(parts[2]);
	const utc = new Date(Date.UTC(y, m - 1, d));
	const week = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
	return `${week[(utc.getUTCDay() + 6) % 7]} ${d}`;
}

function whenLabel(iso: string | undefined, today: string): string {
	if (!iso) return "";
	const day = limaYmd(new Date(iso));
	const time = timeFmt.format(new Date(iso)).toLowerCase().replace(/\s+/g, " ");
	return `${dayLabel(day, today)}, ${time}`;
}

export function rowSubtitle(doc: DocumentListItem, today: string): string {
	if (doc.status === "pending") {
		const when = whenLabel(doc.createdAt, today);
		return when ? `Leyendo la foto · ${when}` : "Leyendo la foto";
	}
	if (doc.status === "failed" || isExtractionIncomplete(doc)) {
		const when = whenLabel(doc.createdAt, today);
		return when ? `Sin categoría · ${when}` : "Sin categoría";
	}
	const day = docDay(doc);
	const when = day ? dayLabel(day, today) : "";
	const category = categoryLabel(doc.category);
	return when ? `${category} · ${when}` : category;
}

export function monthTotals(docs: DocumentListItem[]): { amount: number; count: number } {
	let amount = 0;
	for (const doc of docs) {
		if (doc.status === "ready" && !isExtractionIncomplete(doc) && doc.totalAmount) {
			amount += Number(doc.totalAmount) || 0;
		}
	}
	return { amount, count: docs.length };
}

export function groupDocumentsByPeriod(
	docs: DocumentListItem[],
	now = new Date(),
): PeriodSection[] {
	const today = limaYmd(now);
	const parts = today.split("-");
	const y = Number(parts[0]);
	const m = Number(parts[1]);
	const d = Number(parts[2]);
	const mon0 = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
	const weekStart = new Date(Date.UTC(y, m - 1, d - mon0)).toISOString().slice(0, 10);

	const buckets: Record<PeriodKey, DocumentListItem[]> = {
		hoy: [],
		esta_semana: [],
		anteriores: [],
	};

	for (const doc of docs) {
		const day = docDay(doc);
		if (!day || day === today) buckets.hoy.push(doc);
		else if (day >= weekStart) buckets.esta_semana.push(doc);
		else buckets.anteriores.push(doc);
	}

	const titles: Record<PeriodKey, string> = {
		hoy: "Hoy",
		esta_semana: "Esta semana",
		anteriores: "Anteriores",
	};

	return (["hoy", "esta_semana", "anteriores"] as const)
		.filter((key) => buckets[key].length > 0)
		.map((key) => ({ key, title: titles[key], data: buckets[key] }));
}
