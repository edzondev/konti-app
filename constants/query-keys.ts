export const QUERY_KEYS = {
  receipts: {
    all: ["receipts"] as const,
    details: (id: string) => ["receipts", id] as const,
  },
} as const;
