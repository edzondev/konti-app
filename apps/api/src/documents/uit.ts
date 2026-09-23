import { Logger } from "@nestjs/common";

const UIT_BY_YEAR: Record<number, number> = {
	2024: 5150,
	2025: 5350,
	2026: 5500,
};

const logger = new Logger("uit");

export function getUit(year: number): number {
	const uit = UIT_BY_YEAR[year];
	if (uit !== undefined) return uit;

	const maxYear = Math.max(...Object.keys(UIT_BY_YEAR).map(Number));
	logger.warn(`UIT no definida para el año ${year}, usando ${maxYear}`);
	return UIT_BY_YEAR[maxYear]!;
}
