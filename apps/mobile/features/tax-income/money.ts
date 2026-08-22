const MONEY_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

type MoneyParts = {
	negative: boolean;
	integer: string;
	cents: string;
};

function moneyParts(value: string): MoneyParts | null {
	const trimmed = value.trim();
	if (!MONEY_PATTERN.test(trimmed)) return null;

	const negative = trimmed.startsWith("-");
	const unsigned = negative ? trimmed.slice(1) : trimmed;
	const [integer, rawCents = ""] = unsigned.split(".");
	if (integer === undefined) return null;

	return { negative, integer, cents: rawCents.padEnd(2, "0") };
}

export function normalizeMoney(
	value: string,
	options: { allowNegative?: boolean } = {},
): string | null {
	const parts = moneyParts(value);
	if (!parts || (parts.negative && !options.allowNegative)) return null;
	const sign = parts.negative && `${parts.integer}${parts.cents}` !== "000" ? "-" : "";
	return `${sign}${parts.integer}.${parts.cents}`;
}

export function compareMoney(left: string, right: string): -1 | 0 | 1 {
	const leftParts = moneyParts(left);
	const rightParts = moneyParts(right);
	if (!leftParts || !rightParts) throw new Error("Invalid money value");

	if (leftParts.negative !== rightParts.negative) {
		return leftParts.negative ? -1 : 1;
	}

	const direction = leftParts.negative ? -1 : 1;
	const integerComparison =
		leftParts.integer.length === rightParts.integer.length
			? leftParts.integer.localeCompare(rightParts.integer)
			: leftParts.integer.length > rightParts.integer.length
				? 1
				: -1;
	if (integerComparison !== 0) return (integerComparison * direction) as -1 | 1;

	const centsComparison = leftParts.cents.localeCompare(rightParts.cents);
	if (centsComparison === 0) return 0;
	return (centsComparison * direction) as -1 | 1;
}

export function formatPen(value: string): string {
	const parts = moneyParts(value);
	if (!parts) return "S/ —";

	const groups: string[] = [];
	for (let end = parts.integer.length; end > 0; end -= 3) {
		groups.unshift(parts.integer.slice(Math.max(0, end - 3), end));
	}
	const sign = parts.negative ? "-" : "";
	return `${sign}S/ ${groups.join(",")}.${parts.cents}`;
}
