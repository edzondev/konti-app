import Decimal from "decimal.js";

export const ZERO_MONEY = new Decimal(0);
export const MONEY_INPUT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export function parseMoney(value: string): Decimal {
	return new Decimal(value);
}

export function formatMoney(value: Decimal): string {
	return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function isCalendarDateInTaxYear(value: string, taxYear: number): boolean {
	if (!new RegExp(`^${taxYear}-\\d{2}-\\d{2}$`).test(value)) return false;
	const parsed = new Date(`${value}T00:00:00.000Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
