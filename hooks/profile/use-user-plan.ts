import { usePurchases } from '@/hooks/purchases/use-purchases';
import { hasActiveEntitlement } from '@/services/purchases';
import type { PlanType } from '@/constants/plans';

const TRIAL_PERIOD_DAYS = 7;
const KONTI_PLUS_ENTITLEMENT = 'konti_plus';

export function useUserPlan() {
  const { customerInfo } = usePurchases();

  // Check if user has active subscription based on RevenueCat entitlements
  const hasPlus = hasActiveEntitlement(customerInfo, KONTI_PLUS_ENTITLEMENT);

  // Derive currentPlan from entitlements (source of truth is RevenueCat)
  const currentPlan: PlanType = hasPlus ? 'plus' : 'free';

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
  const hasActiveTrial =
    !hasPlus &&
    customerInfo?.entitlements?.active &&
    Object.keys(customerInfo.entitlements.active).length > 0 &&
    trialDaysRemaining !== null &&
    trialDaysRemaining > 0;

  return {
    currentPlan,
    hasPlus,
    trialDaysRemaining,
    hasActiveTrial,
  };
}
