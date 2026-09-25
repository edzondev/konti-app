const imageSegment = "image" as const;

export const QUERY_KEYS = {
	homeRoot: ["home"] as const,
	home: (userId: string) => [...QUERY_KEYS.homeRoot, userId] as const,
	homeSummary: (userId: string, month: string) =>
		[...QUERY_KEYS.home(userId), "summary", month] as const,
	documentsRoot: ["documents"] as const,
	documents: (userId: string) => [...QUERY_KEYS.documentsRoot, userId] as const,
	documentsMonth: (userId: string, month: string) =>
		[...QUERY_KEYS.documents(userId), month] as const,
	documentImage: (userId: string, id: string) =>
		[...QUERY_KEYS.documents(userId), imageSegment, id] as const,
	deductiblesRoot: ["deductibles"] as const,
	deductibles: (userId: string) => [...QUERY_KEYS.deductiblesRoot, userId] as const,
	deductiblesYear: (userId: string, year: number) =>
		[...QUERY_KEYS.deductibles(userId), "year", year] as const,
	sessionsRoot: ["sessions"] as const,
	sessions: (userId: string) => [...QUERY_KEYS.sessionsRoot, userId] as const,
} as const;

export function isDocumentImageKey(queryKey: readonly unknown[]): boolean {
	return queryKey[2] === imageSegment;
}
