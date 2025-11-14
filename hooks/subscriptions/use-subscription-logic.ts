import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { scheduleOnRN } from 'react-native-worklets';
import type { PurchasesPackage } from 'react-native-purchases';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ALL_FEATURES } from '@/constants/subscription-features';
import { usePurchases } from '@/hooks/purchases/use-purchases';
import { usePurchasePackage } from '@/hooks/purchases/use-purchases-package';

type UseSubscriptionLogicProps = {
  fromPreview?: string;
  imageUrl?: string;
  onClose: () => void;
};

export function useSubscriptionLogic({
  fromPreview,
  imageUrl,
  onClose,
}: UseSubscriptionLogicProps) {
  const { availablePackages, isLoading } = usePurchases();
  const { purchasePackageAsync, isPending: isPurchasing } = usePurchasePackage();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const contentOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);
  const slideDown = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 300 });
  }, [contentOpacity]);

  useEffect(() => {
    if (availablePackages.length > 0 && !selectedPlanId) {
      const annualPlan = availablePackages.find(
        (p) =>
          p.product.title.toLowerCase().includes('pro') ||
          p.product.title.toLowerCase().includes('pro'),
      );
      if (annualPlan) {
        setSelectedPlanId(annualPlan.identifier);
      }
    }
  }, [availablePackages, selectedPlanId]);

  const isPremiumPlan = useMemo(() => {
    if (!selectedPlanId) return false;
    return availablePackages
      .find((p) => p.identifier === selectedPlanId)
      ?.identifier.toLowerCase()
      .includes('premium');
  }, [availablePackages, selectedPlanId]);

  const visibleFeatures = useMemo(() => {
    return ALL_FEATURES.filter((feature) =>
      isPremiumPlan ? feature.premium : feature.pro,
    );
  }, [isPremiumPlan]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const animateClose = useCallback(() => {
    fadeOut.value = withTiming(0, { duration: 300 });
    slideDown.value = withTiming(50, { duration: 300 }, (finished) => {
      if (finished) {
        scheduleOnRN(onClose);
      }
    });
  }, [fadeOut, slideDown, onClose]);

  const handlePurchase = useCallback(
    async (plan: PurchasesPackage) => {
      try {
        const result = await purchasePackageAsync(plan);
        setShowSuccessModal(true);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (result?.originalAppUserId) {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.profile.details(result.originalAppUserId),
          });
        }

        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.purchases.data,
        });
        setShowSuccessModal(false);
        animateClose();
      } catch (error) {
        console.log('[Purchase] Cancelled or failed:', error);
      }
    },
    [purchasePackageAsync, queryClient, animateClose],
  );

  return {
    availablePackages,
    isLoading,
    isPurchasing,
    showSuccessModal,
    selectedPlanId,
    setSelectedPlanId,
    isPremiumPlan,
    visibleFeatures,
    contentAnimatedStyle,
    handlePurchase,
  };
}
