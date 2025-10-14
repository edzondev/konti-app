import { useGetProfile } from './use-profile';

export function useUserPlan() {
  const { data: profile } = useGetProfile();
  const currentPlan = profile?.current_plan ?? 'free';

  return {
    currentPlan,
    isFree: currentPlan === 'free',
    isPro: currentPlan === 'pro',
    isPremium: currentPlan === 'premium',
    hasProOrBetter: ['pro', 'premium'].includes(currentPlan),
  };
}
