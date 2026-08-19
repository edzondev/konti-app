import type { DocumentListItem } from "./types";

const LIMA_TIME_ZONE = "America/Lima";

type DocumentDayGroup = {
	title: string;
	items: DocumentListItem[];
};

function calendarDay(date: Date): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: LIMA_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

	return `${values.year}-${values.month}-${values.day}`;
}

function titleForDay(date: Date, now: Date): string {
	const itemDay = calendarDay(date);
	const currentDay = calendarDay(now);
	if (itemDay === currentDay) return "Hoy";

	const yesterday = new Date(now);
	yesterday.setUTCDate(yesterday.getUTCDate() - 1);
	if (itemDay === calendarDay(yesterday)) return "Ayer";

	return new Intl.DateTimeFormat("es-PE", {
		timeZone: LIMA_TIME_ZONE,
		day: "numeric",
		month: "short",
	}).format(date);
}

export function groupDocumentsByDay(
	items: DocumentListItem[],
	now: Date = new Date(),
): DocumentDayGroup[] {
	const groups = new Map<string, DocumentDayGroup>();

	for (const item of items) {
		const createdAt = new Date(item.createdAt);
		const day = calendarDay(createdAt);
		const group = groups.get(day);
		if (group) {
			group.items.push(item);
			continue;
		}

		groups.set(day, {
			title: titleForDay(createdAt, now),
			items: [item],
		});
	}

	return [...groups.values()];
}
