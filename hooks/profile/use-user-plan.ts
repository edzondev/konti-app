import { useGetProfile } from './use-profile';
import { usePurchases } from '@/hooks/purchases/use-purchases';

const TRIAL_PERIOD_DAYS = 3;

export function useUserPlan() {
  const { data: profile } = useGetProfile();
  const { customerInfo } = usePurchases();
  const currentPlan = profile?.current_plan ?? 'free';

  // Calculate days remaining in free trial
  // Trial period is 3 days from the purchase date (configured in Google Play)
  const getTrialDaysRemaining = (): number | null => {
    if (!customerInfo?.entitlements?.active) return null;

    // Get the first active entitlement (should be the subscription)
    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    if (activeEntitlements.length === 0) return null;

    const entitlement = activeEntitlements[0];
    const purchaseDate = entitlement.latestPurchaseDate;

    if (!purchaseDate) return null;

    // Calculate trial end date (3 days from purchase date)
    const purchaseDateObj = new Date(purchaseDate);
    const trialEndDate = new Date(purchaseDateObj);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS);

    // Calculate days remaining
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    trialEndDate.setHours(0, 0, 0, 0);

    const diffTime = trialEndDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Only return if trial is still active (days > 0)
    return diffDays > 0 ? diffDays : null;
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  // User has active trial if they have an active entitlement but are not on Pro/Premium plan yet
  // and trial period hasn't ended
  const hasActiveTrial =
    !['pro', 'premium'].includes(currentPlan) &&
    customerInfo?.entitlements?.active &&
    Object.keys(customerInfo.entitlements.active).length > 0 &&
    trialDaysRemaining !== null &&
    trialDaysRemaining > 0;

  return {
    currentPlan,
    isFree: currentPlan === 'free',
    isPro: currentPlan === 'pro',
    isPremium: currentPlan === 'premium',
    hasProOrBetter: ['pro', 'premium'].includes(currentPlan),
    trialDaysRemaining,
    hasActiveTrial,
  };
}
