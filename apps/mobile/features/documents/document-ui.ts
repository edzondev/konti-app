import type { DocumentListItem } from "./document";

const LIMA = "America/Lima";

const limaYmdFormatter = new Intl.DateTimeFormat("en-CA", {
	timeZone: LIMA,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

const limaTimeFormatter = new Intl.DateTimeFormat("es-PE", {
	timeZone: LIMA,
	hour: "numeric",
	minute: "2-digit",
	hour12: true,
});

const moneyFormatter = new Intl.NumberFormat("es-PE", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const CATEGORY_LABELS: Record<string, string> = {
	restaurantes: "Restaurantes",
	supermercado: "Supermercado",
	transporte: "Transporte",
	servicios_medicos: "Servicios médicos",
	servicios_profesionales: "Servicios profesionales",
	hogar_servicios: "Hogar y servicios",
	entretenimiento: "Entretenimiento",
	educacion: "Educación",
	otros: "Otros",
};

const TYPE_LABELS: Record<string, string> = {
	boleta: "Boleta",
	factura: "Factura",
	recibo_honorarios: "Recibo por honorarios",
	ticket: "Ticket",
	unknown: "Sin tipo",
};

const SOURCE_LABELS: Record<string, string> = {
	camera: "Cámara",
	gallery: "Galería",
	share: "Compartido",
};

export const DOCUMENT_TYPE_OPTIONS = [
	{ value: "boleta", label: "Boleta" },
	{ value: "factura", label: "Factura" },
	{ value: "recibo_honorarios", label: "Recibo por honorarios" },
	{ value: "ticket", label: "Ticket" },
] as const;

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

export type PeriodKey = "hoy" | "esta_semana" | "anteriores";

export type PeriodSection = {
	key: PeriodKey;
	title: string;
	data: DocumentListItem[];
};

export function limaYmd(date: Date): string {
	return limaYmdFormatter.format(date);
}

export function shiftMonth(month: string, delta: number): string {
	const [yearPart, monthPart] = month.split("-");
	const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1 + delta, 1));
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

export function monthTitle(month: string): string {
	const { year, monthIndex0 } = parseMonth(month);
	return `${MONTH_NAMES[monthIndex0]} ${year}`;
}

export function monthFromParts(year: number, monthIndex0: number): string {
	return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

export function parseMonth(month: string): { year: number; monthIndex0: number } {
	const [yearPart, monthPart] = month.split("-");
	return { year: Number(yearPart), monthIndex0: Number(monthPart) - 1 };
}

export function formatMoney(amount: string | null | undefined): string {
	if (amount == null || amount === "") return "0.00";
	const n = Number(amount);
	if (Number.isNaN(n)) return amount;
	return moneyFormatter.format(n);
}

export function formatSoles(amount: string | null | undefined): string {
	return `S/ ${formatMoney(amount)}`;
}

export function categoryLabel(category: string): string {
	return CATEGORY_LABELS[category] ?? "Sin categoría";
}

export function documentTypeLabel(type: string): string {
	return TYPE_LABELS[type] ?? type;
}

export function sourceLabel(source: string | undefined): string {
	if (!source) return "—";
	return SOURCE_LABELS[source] ?? source;
}

export function formatIssueDate(isoDate: string | null | undefined): string {
	if (!isoDate) return "—";
	const [y, m, d] = isoDate.slice(0, 10).split("-");
	if (!y || !m || !d) return isoDate;
	return `${d}/${m}/${y}`;
}

export function docDay(doc: DocumentListItem): string | null {
	if (doc.issueDate) return doc.issueDate.slice(0, 10);
	if (doc.createdAt) return limaYmd(new Date(doc.createdAt));
	return null;
}

function parseYmd(ymd: string): { y: number; m: number; d: number } {
	const [yearPart, monthPart, dayPart] = ymd.split("-");
	return { y: Number(yearPart), m: Number(monthPart), d: Number(dayPart) };
}

function weekdayMon0(ymd: string): number {
	const { y, m, d } = parseYmd(ymd);
	const utc = new Date(Date.UTC(y, m - 1, d));
	return (utc.getUTCDay() + 6) % 7;
}

function addDays(ymd: string, days: number): string {
	const { y, m, d } = parseYmd(ymd);
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export function dayLabel(ymd: string, today: string): string {
	if (ymd === today) return "Hoy";
	const { y, m, d } = parseYmd(ymd);
	const utc = new Date(Date.UTC(y, m - 1, d));
	return `${WEEKDAYS_SHORT[(utc.getUTCDay() + 6) % 7]} ${d}`;
}

export function formatCreatedTime(iso: string | undefined, today: string): string {
	if (!iso) return "";
	const day = limaYmd(new Date(iso));
	const time = limaTimeFormatter.format(new Date(iso)).toLowerCase().replace(/\s+/g, " ");
	return `${dayLabel(day, today)}, ${time}`;
}

export function rowSubtitle(doc: DocumentListItem, today: string): string {
	const day = docDay(doc);
	const when = day ? dayLabel(day, today) : "";

	if (doc.status === "pending") {
		const time = formatCreatedTime(doc.createdAt, today);
		return time ? `Leyendo la foto · ${time}` : "Leyendo la foto";
	}

	if (doc.status === "failed") {
		const time = formatCreatedTime(doc.createdAt, today);
		return time ? `Sin categoría · ${time}` : "Sin categoría";
	}

	const category = categoryLabel(doc.category);
	return when ? `${category} · ${when}` : category;
}

export function monthTotals(docs: DocumentListItem[]): { amount: number; count: number } {
	let amount = 0;
	for (const doc of docs) {
		if (doc.status === "ready" && doc.totalAmount) {
			amount += Number(doc.totalAmount) || 0;
		}
	}
	return { amount, count: docs.length };
}

export function groupDocumentsByPeriod(docs: DocumentListItem[], now = new Date()): PeriodSection[] {
	const today = limaYmd(now);
	const weekStart = addDays(today, -weekdayMon0(today));

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
