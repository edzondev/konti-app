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
  DEDUCTION_LIMIT: 'deduction-limit',
  SUSPECT_RECEIPTS: 'suspect-receipts',
  DEDUCTIONS_BY_CATEGORY: 'deductions-by-category',
  ANNUAL_SUMMARY: 'annual-summary',
  ASK_KONTI: 'ask-konti',
  ANNUAL_REPORT: 'annual-report',
} as const;
