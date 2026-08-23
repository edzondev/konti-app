export function shouldClearQueryCache(
	previousUserId: string | undefined,
	nextUserId: string | undefined,
): boolean {
	return previousUserId !== undefined && previousUserId !== nextUserId;
}
