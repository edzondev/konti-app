export const QUERY_KEYS = {
	documents: ["documents"] as const,
	documentsMonth: (month: string) => [...QUERY_KEYS.documents, month] as const,
} as const;
