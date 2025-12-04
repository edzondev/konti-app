import { useCallback, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { scheduleOnRN } from 'react-native-worklets';
import type { PurchasesPackage } from 'react-native-purchases';
import { QUERY_KEYS } from '@/constants/query-keys';
import { FEATURES } from '@/constants/subscription-features';
import { usePurchases } from '@/hooks/purchases/use-purchases';
import { usePurchasePackage } from '@/hooks/purchases/use-purchases-package';
import { hasActiveEntitlement } from '@/services/purchases';

type UseSubscriptionLogicProps = {
  onClose: () => void;
};

export function useSubscriptionLogic({ onClose }: UseSubscriptionLogicProps) {
  const { availablePackages, isLoading, customerInfo } = usePurchases();
  const { purchasePackageAsync, isPending: isPurchasing } =
    usePurchasePackage();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const queryClient = useQueryClient();

  const fadeOut = useSharedValue(1);
  const slideDown = useSharedValue(0);

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
    features: FEATURES,
    handlePurchase,
    havePlan: hasActiveEntitlement(customerInfo, 'konti_plus'),
  };
}
