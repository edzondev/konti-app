import { useEffect } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LIMIT_PLANS } from '@/constants/plans';
import { PLAN_CONFIG } from '@/constants/dashboard';
import { useUserPlan } from '@/hooks/profile/use-user-plan';
import { useReceiptKpis } from '@/hooks/receipts/use-receipt-kpis';

export function useDashboardHeader() {
  const { currentPlan, hasProOrBetter } = useUserPlan();
  const { data: kpis, isLoading: kpisLoading } = useReceiptKpis();
  const progressWidth = useSharedValue(0);

  const planLimit = LIMIT_PLANS[currentPlan as keyof typeof LIMIT_PLANS];
  const planConfig =
    PLAN_CONFIG[currentPlan as keyof typeof PLAN_CONFIG] || PLAN_CONFIG.free;

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  useEffect(() => {
    const getUsagePercentage = () => {
      if (planLimit === Number.POSITIVE_INFINITY) return 0;
      return ((kpis?.total_receipts ?? 0) / planLimit) * 100;
    };

    const percentage = getUsagePercentage();
    progressWidth.value = withTiming(Math.min(percentage, 100), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressWidth, kpis?.total_receipts, planLimit]);

  return {
    kpis,
    kpisLoading,
    hasProOrBetter,
    planLimit,
    planConfig,
    animatedProgressStyle,
  };
}
