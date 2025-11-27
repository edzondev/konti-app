import { useCallback } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';

import { COLORS } from '@/constants/colors';
import { PaymentSuccessModal } from '@/components/shared/modals/payment-success-modal';
import { cn } from '@/lib/utils';
import PlanCard from '@/components/shared/suscription/plan-card';
import { FeatureItem } from '@/components/shared/suscription/feature-item';
import { useSubscriptionLogic } from '@/hooks/subscriptions/use-subscription-logic';
import { Feature } from '@/constants/subscription-features';

export default function SubscriptionScreen() {
  const { fromPreview, imageUrl } = useLocalSearchParams<{
    fromPreview?: string;
    imageUrl?: string;
  }>();

  const handleClose = useCallback(() => {
    if (fromPreview === 'true' && imageUrl) {
      router.replace({
        pathname: '/preview',
        params: { imageUrl },
      });
    } else {
      router.back();
    }
  }, [fromPreview, imageUrl]);

  const {
    availablePackages,
    isLoading,
    isPurchasing,
    showSuccessModal,
    selectedPlanId,
    setSelectedPlanId,
    features,
    contentAnimatedStyle,
    handlePurchase,
  } = useSubscriptionLogic({ onClose: handleClose });

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-white"
        edges={['top']}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <PaymentSuccessModal visible={showSuccessModal} />

      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <FlashList
          data={features}
          keyExtractor={(item: Feature) => item.title}
          renderItem={({ item }) => <FeatureItem feature={item} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Animated.View style={[contentAnimatedStyle]} className="px-6">
              <View className="flex-row items-center justify-between pb-6 pt-4">
                <TouchableOpacity
                  onPress={handleClose}
                  className="rounded-full bg-neutral-100 p-2"
                >
                  <X size={20} color={COLORS.neutral.foreground} />
                </TouchableOpacity>
              </View>

              <View className="mb-8 flex-row gap-4">
                {availablePackages.map((plan) => (
                  <PlanCard
                    key={plan.identifier}
                    plan={plan}
                    isSelected={selectedPlanId === plan.identifier}
                    onSelect={() => setSelectedPlanId(plan.identifier)}
                    emoji={plan.identifier === 'pro' ? '🤓' : '🚀'}
                  />
                ))}
              </View>
            </Animated.View>
          }
          contentContainerStyle={{ paddingBottom: 16 }}
        />
        <View className="bg-white px-6 pb-6 pt-4">
          <Pressable
            onPress={() =>
              handlePurchase(
                availablePackages.find(
                  (p) => p.identifier === selectedPlanId,
                ) ?? availablePackages[0],
              )
            }
            disabled={isPurchasing || !selectedPlanId}
            className={cn(
              'h-14 items-center justify-center rounded-full',
              isPurchasing || !selectedPlanId ? 'bg-neutral-300' : 'bg-primary',
            )}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-base font-bold text-white">
                Obtener tu prueba gratis
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
