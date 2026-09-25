import { formatMoney, monthLabel } from "@/features/home/home-format";
import { currentLimaMonth, formatLimaDay } from "@/features/home/home-summary";
import type { Document } from "./comprobantes-document";
import { CATEGORY_LABELS } from "./document-form";

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

const MONTH_ABBR = [
	"ene",
	"feb",
	"mar",
	"abr",
	"may",
	"jun",
	"jul",
	"ago",
	"sep",
	"oct",
	"nov",
	"dic",
] as const;

export function limaDayIso(date: Date): string {
	return formatLimaDay(date);
}

function parseIsoDate(isoDate: string): { y: number; m: number; d: number } {
	const [y = 0, m = 0, d = 0] = isoDate.split("-").map(Number);
	return { y, m, d };
}

function utcDateFromIso(isoDate: string): Date {
	const { y, m, d } = parseIsoDate(isoDate);
	return new Date(Date.UTC(y, m - 1, d, 17, 0, 0));
}

function isoFromUtcDate(date: Date): string {
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const d = String(date.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function addDays(isoDate: string, days: number): string {
	const date = utcDateFromIso(isoDate);
	date.setUTCDate(date.getUTCDate() + days);
	return isoFromUtcDate(date);
}

function mondayOf(isoDate: string): string {
	const date = utcDateFromIso(isoDate);
	const weekday = date.getUTCDay();
	const offset = weekday === 0 ? 6 : weekday - 1;
	date.setUTCDate(date.getUTCDate() - offset);
	return isoFromUtcDate(date);
}

function sundayOf(isoDate: string): string {
	const monday = mondayOf(isoDate);
	return addDays(monday, 6);
}

function monthBounds(month: string): { start: string; end: string } {
	const [y = 0, m = 0] = month.split("-").map(Number);
	const start = `${month}-01`;
	const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
	const end = `${month}-${String(lastDay).padStart(2, "0")}`;
	return { start, end };
}

function clipRange(
	weekMonday: string,
	weekSunday: string,
	month: string,
): { start: string; end: string } {
	const { start: monthStart, end: monthEnd } = monthBounds(month);
	const start = weekMonday > monthStart ? weekMonday : monthStart;
	const end = weekSunday < monthEnd ? weekSunday : monthEnd;
	return { start, end };
}

function rangeTitle(start: string, end: string): string {
	const startParts = parseIsoDate(start);
	const endParts = parseIsoDate(end);
	const endAbbr = MONTH_ABBR[endParts.m - 1];

	if (start === end) {
		return `${startParts.d} ${endAbbr}`;
	}

	return `${startParts.d}–${endParts.d} ${endAbbr}`;
}

const DEDUCTIBLE_CATEGORIES = new Set<Document["category"]>([
	"restaurantes",
	"servicios_medicos",
	"servicios_profesionales",
]);

function needsDateForDeduction(document: Document): boolean {
	return (
		document.issueDate == null &&
		document.status === "ready" &&
		DEDUCTIBLE_CATEGORIES.has(document.category)
	);
}

export function undatedDeductibleNote(documents: Document[]): string | null {
	const names = documents
		.filter(needsDateForDeduction)
		.map((document) => document.issuerName?.trim() || "Comprobante");

	if (names.length === 0) return null;
	if (names.length === 1) return `${names[0]} sin fecha. Complétala para ver si deduce.`;
	if (names.length === 2) {
		return `${names[0]} y ${names[1]} sin fecha. Complétalas para ver si deducen.`;
	}
	return `${names.length} boletas sin fecha. Complétalas para ver si deducen.`;
}

function anchorDay(document: Document): string {
	if (document.issueDate) {
		return document.issueDate;
	}
	return limaDayIso(new Date(document.createdAt));
}

const limaClockFormat = new Intl.DateTimeFormat("en-US", {
	timeZone: "America/Lima",
	hour: "numeric",
	minute: "2-digit",
	hour12: true,
});

export function formatClock(iso: string): string {
	const parts = limaClockFormat.formatToParts(new Date(iso));

	const hour = parts.find((part) => part.type === "hour")?.value ?? "0";
	const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
	const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value;
	const period = dayPeriod === "AM" ? "a.m." : "p.m.";

	return `${hour}:${minute} ${period}`;
}

export function dayLabel(isoDate: string, todayIso: string): string {
	if (isoDate === todayIso) {
		return "Hoy";
	}

	const weekday = WEEKDAYS[utcDateFromIso(isoDate).getUTCDay()];
	const day = parseIsoDate(isoDate).d;
	return `${weekday} ${day}`;
}

export function whenLabel(createdAtIso: string, todayIso: string): string {
	const day = limaDayIso(new Date(createdAtIso));
	return `${dayLabel(day, todayIso)}, ${formatClock(createdAtIso)}`;
}

function sectionTitle(
	anchor: string,
	month: string,
	todayIso: string,
	currentMonth: string,
): { title: string; sortKey: string } {
	const weekMonday = mondayOf(anchor);
	const weekSunday = sundayOf(anchor);
	const clipped = clipRange(weekMonday, weekSunday, month);
	const clippedTitle = rangeTitle(clipped.start, clipped.end);

	if (month !== currentMonth) {
		return { title: clippedTitle, sortKey: clipped.start };
	}

	if (anchor === todayIso) {
		return { title: "Hoy", sortKey: anchor };
	}

	const todayMonday = mondayOf(todayIso);
	if (weekMonday === todayMonday) {
		return { title: "Esta semana", sortKey: clipped.start };
	}

	const lastWeekMonday = addDays(todayMonday, -7);
	if (weekMonday === lastWeekMonday) {
		return { title: "Semana pasada", sortKey: clipped.start };
	}

	return { title: clippedTitle, sortKey: clipped.start };
}

export function groupDocuments(
	documents: Document[],
	month: string,
	now: Date = new Date(),
): { title: string; documents: Document[] }[] {
	const todayIso = limaDayIso(now);
	const currentMonth = currentLimaMonth(now);

	const grouped = new Map<string, { title: string; sortKey: string; documents: Document[] }>();

	for (const document of documents) {
		if (needsDateForDeduction(document)) continue;

		const anchor = anchorDay(document);
		if (!anchor.startsWith(`${month}-`)) {
			continue;
		}

		const { title, sortKey } = sectionTitle(anchor, month, todayIso, currentMonth);
		const key = `${sortKey}|${title}`;
		const existing = grouped.get(key);

		if (existing) {
			existing.documents.push(document);
		} else {
			grouped.set(key, { title, sortKey, documents: [document] });
		}
	}

	return [...grouped.values()]
		.sort((a, b) => b.sortKey.localeCompare(a.sortKey))
		.map(({ title, documents: sectionDocuments }) => ({
			title,
			documents: [...sectionDocuments].sort((a, b) => {
				const anchorA = anchorDay(a);
				const anchorB = anchorDay(b);
				const anchorCompare = anchorB.localeCompare(anchorA);
				if (anchorCompare !== 0) {
					return anchorCompare;
				}
				return b.createdAt.localeCompare(a.createdAt);
			}),
		}));
}

export function shiftMonth(month: string, delta: number): string {
	const [y = 0, m = 0] = month.split("-").map(Number);
	const date = new Date(Date.UTC(y, m - 1 + delta, 1));
	const year = date.getUTCFullYear();
	const monthNum = String(date.getUTCMonth() + 1).padStart(2, "0");
	return `${year}-${monthNum}`;
}

function canGoNext(month: string, now: Date): boolean {
	return month < currentLimaMonth(now);
}

function countLabel(count: number): string {
	if (count === 1) {
		return "1 comprobante";
	}
	return `${count} comprobantes`;
}

function toListRow(document: Document, todayIso: string): ListRow {
	if (document.status === "pending" && document.extractionSource === "manual") {
		return {
			kind: "pending",
			id: document.id,
			title: "Completar datos",
			subtitle: `Ingresa los campos · ${whenLabel(document.createdAt, todayIso)}`,
		};
	}

	if (document.status === "pending") {
		return {
			kind: "pending",
			id: document.id,
			title: "Procesando...",
			subtitle: `Leyendo la foto · ${whenLabel(document.createdAt, todayIso)}`,
		};
	}

	if (document.status === "failed") {
		return {
			kind: "failed",
			id: document.id,
			title: "No pudimos leerlo",
			subtitle: `Sin categoría · ${whenLabel(document.createdAt, todayIso)}`,
		};
	}

	const anchor = anchorDay(document);
	const title = document.issuerName?.trim() || "Comprobante";

	return {
		kind: "ready",
		id: document.id,
		title,
		subtitle: `${CATEGORY_LABELS[document.category]} · ${dayLabel(anchor, todayIso)}`,
		amountLabel: document.totalAmount === null ? "" : formatMoney(Number(document.totalAmount)),
	};
}

function toUndatedRow(document: Document): ListRow {
	return {
		kind: "ready",
		id: document.id,
		title: document.issuerName?.trim() || "Comprobante",
		subtitle: `${CATEGORY_LABELS[document.category]} · Sin fecha`,
		amountLabel: document.totalAmount === null ? "" : formatMoney(Number(document.totalAmount)),
	};
}

export type ListRow =
	| {
			kind: "ready";
			id: string;
			title: string;
			subtitle: string;
			amountLabel: string;
	  }
	| {
			kind: "pending";
			id: string;
			title: "Procesando..." | "Completar datos";
			subtitle: string;
	  }
	| {
			kind: "failed";
			id: string;
			title: "No pudimos leerlo";
			subtitle: string;
	  };

export type ComprobantesListView =
	| { kind: "loading"; monthLabel: string; canGoNext: boolean }
	| {
			kind: "error";
			monthLabel: string;
			canGoNext: boolean;
			message: string;
	  }
	| {
			kind: "empty";
			monthLabel: string;
			totalLabel: string;
			countLabel: string;
			canGoNext: boolean;
	  }
	| {
			kind: "ready";
			monthLabel: string;
			totalLabel: string;
			countLabel: string;
			canGoNext: boolean;
			sections: { title: string; rows: ListRow[] }[];
			undatedRows: ListRow[];
	  };

export function toListView(input: {
	status: "pending" | "error" | "success";
	documents?: Document[];
	month: string;
	now?: Date;
}): ComprobantesListView {
	const now = input.now ?? new Date();
	const label = monthLabel(input.month);
	const next = canGoNext(input.month, now);

	if (input.status === "pending") {
		return { kind: "loading", monthLabel: label, canGoNext: next };
	}

	if (input.status === "error") {
		return {
			kind: "error",
			monthLabel: label,
			canGoNext: next,
			message: "No pudimos cargar tus comprobantes.",
		};
	}

	const documents = input.documents ?? [];
	const todayIso = limaDayIso(now);

	if (documents.length === 0) {
		return {
			kind: "empty",
			monthLabel: label,
			totalLabel: "S/ 0.00",
			countLabel: "0 comprobantes",
			canGoNext: next,
		};
	}

	const total = documents
		.filter((document) => document.status === "ready")
		.reduce((sum, document) => {
			if (document.totalAmount === null) {
				return sum;
			}
			return sum + Number(document.totalAmount);
		}, 0);

	const sections = groupDocuments(documents, input.month, now).map((section) => ({
		title: section.title,
		rows: section.documents.map((document) => toListRow(document, todayIso)),
	}));
	const undatedRows = documents
		.filter(needsDateForDeduction)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map(toUndatedRow);

	return {
		kind: "ready",
		monthLabel: label,
		totalLabel: `S/ ${formatMoney(total)}`,
		countLabel: countLabel(documents.length),
		canGoNext: next,
		sections,
		undatedRows,
	};
}
