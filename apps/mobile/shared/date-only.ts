const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LIMA_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: "America/Lima",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

export type DateOnly = string;

export function isDateOnly(value: string): boolean {
	const parts = dateOnlyParts(value);
	if (!parts) return false;
	const result = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
	return (
		result.getUTCFullYear() === parts.year &&
		result.getUTCMonth() === parts.month - 1 &&
		result.getUTCDate() === parts.day
	);
}

export function dateOnlyToPickerDate(value: string): Date {
	const parts = dateOnlyParts(value);
	if (!parts || !isDateOnly(value)) throw new Error("Invalid date-only value");
	return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
}

export function pickerDateToDateOnly(value: Date): DateOnly {
	if (Number.isNaN(value.getTime())) throw new Error("Invalid picker date");
	const year = String(value.getUTCFullYear()).padStart(4, "0");
	const month = String(value.getUTCMonth() + 1).padStart(2, "0");
	const day = String(value.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function todayDateOnlyInLima(now = new Date()): DateOnly {
	const parts = Object.fromEntries(
		LIMA_DATE_FORMATTER.formatToParts(now).map((part) => [part.type, part.value]),
	);
	return `${parts.year}-${parts.month}-${parts.day}`;
}

export function clampDateOnly(
	value: DateOnly,
	minimumDate: DateOnly,
	maximumDate: DateOnly,
): DateOnly {
	assertDateRange(minimumDate, maximumDate);
	if (!isDateOnly(value)) throw new Error("Invalid date-only value");
	if (value < minimumDate) return minimumDate;
	if (value > maximumDate) return maximumDate;
	return value;
}

export function resolveDateOnlyViewport({
	value,
	emptyViewportDate,
	minimumDate,
	maximumDate,
}: {
	value: DateOnly | "";
	emptyViewportDate?: DateOnly;
	minimumDate: DateOnly;
	maximumDate: DateOnly;
}): DateOnly {
	assertDateRange(minimumDate, maximumDate);
	const candidate = value && isDateOnly(value) ? value : (emptyViewportDate ?? maximumDate);
	return clampDateOnly(candidate, minimumDate, maximumDate);
}

function dateOnlyParts(value: string) {
	const match = DATE_ONLY_PATTERN.exec(value);
	if (!match) return null;
	return {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3]),
	};
}

function assertDateRange(minimumDate: DateOnly, maximumDate: DateOnly) {
	if (!isDateOnly(minimumDate) || !isDateOnly(maximumDate) || minimumDate > maximumDate) {
		throw new Error("Invalid date-only range");
	}
}
