export const QUERY_KEYS = {
  receipts: {
    all: ["receipts"] as const,
    details: (id: string) => ["receipts", id] as const,
    kpis: ["receipts", "kpis"] as const,
  },
  profile: {
    details: ["profile"] as const,
  },
  purchases: {
    data: ["purchases", "data"] as const,
  },
} as const;
