export const LIMIT_PLANS = {
  free: 5,
  konti_pro: Number.POSITIVE_INFINITY,
  // Legacy plans (for backwards compatibility)
  pro: 20,
  premium: Number.POSITIVE_INFINITY,
} as const;

export type PlanType = keyof typeof LIMIT_PLANS;
