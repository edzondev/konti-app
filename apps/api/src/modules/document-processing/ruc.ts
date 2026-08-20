const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

export function isValidPeruRuc(value: string): boolean {
	if (!/^\d{11}$/.test(value)) {
		return false;
	}

	const digits = value.split("").map(Number);
	const sum = RUC_WEIGHTS.reduce((acc, weight, index) => acc + weight * (digits[index] ?? 0), 0);
	let check = 11 - (sum % 11);
	if (check === 10) {
		check = 0;
	} else if (check === 11) {
		check = 1;
	}

	return check === digits[10];
}
