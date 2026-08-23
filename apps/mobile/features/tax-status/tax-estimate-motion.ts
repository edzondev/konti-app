const ROW_STAGGER_MS = 24;
const MAX_STAGGER_STEPS = 6;

export function taxEstimateRowDelay(index: number, reducedMotion: boolean): number {
	if (reducedMotion) return 0;
	return Math.min(Math.max(index, 0), MAX_STAGGER_STEPS) * ROW_STAGGER_MS;
}
