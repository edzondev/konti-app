export const QUERY_KEYS = {
	home: ["home"] as const,
	homeSummary: (month: string) => [...QUERY_KEYS.home, "summary", month] as const,
	documents: ["documents"] as const,
	documentsMonth: (month: string) => [...QUERY_KEYS.documents, month] as const,
	documentImage: (id: string) => [...QUERY_KEYS.documents, "image", id] as const,
} as const;
