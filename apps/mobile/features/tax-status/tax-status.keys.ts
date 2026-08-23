export const taxStatusKeys = {
	all: (userId: string) => ["tax-status", userId] as const,
	current: (userId: string) => [...taxStatusKeys.all(userId), "current"] as const,
	evaluation: (userId: string, id: string) =>
		[...taxStatusKeys.all(userId), "evaluation", id] as const,
};
