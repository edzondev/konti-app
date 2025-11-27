import { LIMIT_PLANS, type PlanType } from '@/constants/plans';
import { PLAN_CONFIG } from '@/constants/dashboard';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useReceiptKpis } from '@/hooks/receipts/use-receipt-kpis';

export function useDashboardHeader() {
  const { currentPlan, isPaidPlan } = useUserPlan();
  const { data: kpis, isLoading: kpisLoading } = useReceiptKpis();

  const planLimit = LIMIT_PLANS[currentPlan as PlanType] ?? LIMIT_PLANS.free;
  const planConfig =
    PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] ?? PLAN_CONFIG.free;

  const isUnlimited = planLimit === Number.POSITIVE_INFINITY;
  const usedCount = kpis?.total_receipts ?? 0;
  const remainingCount = isUnlimited ? null : Math.max(0, planLimit - usedCount);

  return {
    kpis,
    kpisLoading,
    isPaidPlan,
    planLimit,
    planConfig,
    isUnlimited,
    usedCount,
    remainingCount,
  };
}
