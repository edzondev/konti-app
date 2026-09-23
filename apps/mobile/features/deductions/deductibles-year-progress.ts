export function yearProgress(totalAmount: number, topAmount: number): number {
	if (topAmount <= 0) return 0;
	return Math.min(1, Math.max(0, totalAmount / topAmount));
}
