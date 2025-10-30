export const QUERY_KEYS = {
  receipts: {
    all: (userId: string) => ['receipts', userId] as const,
    details: (id: string) => ['receipts', id] as const,
    kpis: (userId: string) => ['receipts', 'kpis', userId] as const,
  },
  profile: {
    details: (userId: string) => ['profile', userId] as const,
  },
  purchases: {
    data: ['purchases', 'data'] as const,
  },
} as const;
