import { useCallback } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Pressable,
  Keyboard,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { PaymentSuccessModal } from '@/components/shared/modals/payment-success-modal';
import { cn } from '@/lib/utils';
import PlanCard from '@/components/shared/suscription/plan-card';
import { X } from 'lucide-react-native';
import { useSubscriptionLogic } from '@/hooks/subscriptions/use-subscription-logic';

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
    visibleFeatures,
    contentAnimatedStyle,
    handlePurchase,
  } = useSubscriptionLogic({ fromPreview, imageUrl, onClose: handleClose });

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

      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <Animated.View style={[contentAnimatedStyle]} className="px-6">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-6 pt-4">
              <TouchableOpacity
                onPress={handleClose}
                className="rounded-full bg-neutral-100 p-2"
              >
                <X size={20} color={COLORS.neutral.foreground} />
              </TouchableOpacity>
            </View>

            {/* Plans Section */}
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

            {/* Features Section */}
            <View className="gap-4">
              {visibleFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <View
                    key={index}
                    className="flex-row items-start gap-4 rounded-2xl bg-neutral-50 p-4"
                  >
                    <View className="h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                      <Icon size={24} color={COLORS.secondary} />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-base font-bold text-neutral-900">
                        {feature.title}
                      </Text>
                      {feature.isAvailableInFuture ? (
                        <Text className="text-sm leading-5 text-muted-foreground">
                          Proximamente
                        </Text>
                      ) : (
                        <Text className="text-sm leading-5 text-neutral-600">
                          {feature.description}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 bg-white px-6 pb-6 pt-4">
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
