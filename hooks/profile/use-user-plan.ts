import { useGetProfile } from './use-profile';
import { usePurchases } from '@/hooks/purchases/use-purchases';
import type { PlanType } from '@/constants/plans';

const TRIAL_PERIOD_DAYS = 3;
const PAID_PLANS: PlanType[] = ['konti_pro', 'pro', 'premium'];

export function useUserPlan() {
  const { data: profile } = useGetProfile();
  const { customerInfo } = usePurchases();
  const currentPlan = (profile?.current_plan ?? 'free') as PlanType;

  const getTrialDaysRemaining = (): number | null => {
    if (!customerInfo?.entitlements?.active) return null;

    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    if (activeEntitlements.length === 0) return null;

    const entitlement = activeEntitlements[0];
    const purchaseDate = entitlement.latestPurchaseDate;

    if (!purchaseDate) return null;

    const purchaseDateObj = new Date(purchaseDate);
    const trialEndDate = new Date(purchaseDateObj);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    trialEndDate.setHours(0, 0, 0, 0);

    const diffTime = trialEndDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : null;
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isPaidPlan = PAID_PLANS.includes(currentPlan);
  const hasActiveTrial =
    !isPaidPlan &&
    customerInfo?.entitlements?.active &&
    Object.keys(customerInfo.entitlements.active).length > 0 &&
    trialDaysRemaining !== null &&
    trialDaysRemaining > 0;

  return {
    currentPlan,
    isFree: currentPlan === 'free',
    isKontiPro: currentPlan === 'konti_pro',
    isPaidPlan,
    // Legacy helpers (for backwards compatibility)
    isPro: currentPlan === 'pro',
    isPremium: currentPlan === 'premium',
    hasProOrBetter: isPaidPlan,
    trialDaysRemaining,
    hasActiveTrial,
  };
}
