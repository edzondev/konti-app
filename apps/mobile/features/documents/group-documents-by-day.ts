import type { DocumentListItem } from "./types";

const LIMA_TIME_ZONE = "America/Lima";
const DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: LIMA_TIME_ZONE });
const DATE_TITLE_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	timeZone: LIMA_TIME_ZONE,
	day: "numeric",
	month: "short",
});

type DocumentDayGroup = {
	title: string;
	items: DocumentListItem[];
};

function calendarDay(date: Date): string {
	return DAY_FORMATTER.format(date);
}

function titleForDay(date: Date, now: Date): string {
	const itemDay = calendarDay(date);
	const currentDay = calendarDay(now);
	if (itemDay === currentDay) return "Hoy";

	const yesterday = new Date(now);
	yesterday.setUTCDate(yesterday.getUTCDate() - 1);
	if (itemDay === calendarDay(yesterday)) return "Ayer";

	return DATE_TITLE_FORMATTER.format(date);
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
