export const QUERY_KEYS = {
	documents: ["documents"] as const,
	documentsMonth: (month: string) => [...QUERY_KEYS.documents, month] as const,
	document: (id: string) => [...QUERY_KEYS.documents, "id", id] as const,
	documentImage: (id: string) => [...QUERY_KEYS.documents, "id", id, "image"] as const,
} as const;
