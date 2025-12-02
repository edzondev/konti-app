import {
  ActivityIndicator,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Shield } from 'lucide-react-native';

import { COLORS } from '@/constants/colors';
import { PaymentSuccessModal } from '@/components/shared/modals/payment-success-modal';
import { SinglePlanCard } from '@/components/shared/suscription/single-plan-card';
import { FeatureGrid } from '@/components/shared/suscription/feature-grid';
import { useSubscriptionLogic } from '@/hooks/subscriptions/use-subscription-logic';

export default function SubscriptionScreen() {
  const handleClose = () => router.back();

  const {
    availablePackages,
    isLoading,
    isPurchasing,
    showSuccessModal,
    features,
    handlePurchase,
    havePlan,
  } = useSubscriptionLogic({ onClose: handleClose });

  const handleCancelSubscription = async () => {
    await Linking.openURL(
      'https://play.google.com/store/account/subscriptions?id=com.edzon2121.KontiApp',
    );
  };

  const mainPlan = availablePackages[0];

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-white"
        edges={['top']}
      >
        <ActivityIndicator size="large" color={COLORS.primary.default} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <PaymentSuccessModal visible={showSuccessModal} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="flex-row items-center justify-between p-4">
          <Pressable
            onPress={handleClose}
            className="rounded-full bg-neutral-100 p-2.5"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={COLORS.neutral.foreground} />
          </Pressable>
          <View className="flex-1" />
        </View>

        <View className="mb-6 px-6">
          <Text className="mb-2 text-3xl font-bold text-neutral-900">
            Desbloquea todo el{'\n'}potencial de Konti
          </Text>
          <Text className="text-base text-neutral-500">
            Maximiza tus deducciones y ahorra tiempo con nuestra IA
          </Text>
        </View>

        {mainPlan && (
          <View className="mb-8 px-6">
            <SinglePlanCard plan={mainPlan} havePlan={havePlan} />
          </View>
        )}

        <FeatureGrid features={features} />

        <View className="mt-8 px-6">
          <View className="flex-row items-center justify-center gap-2 rounded-xl bg-neutral-50 py-3">
            <Shield size={16} color={COLORS.neutral.muted} />
            <Text className="text-xs text-neutral-500">Pago seguro •</Text>
            <Pressable onPress={handleCancelSubscription}>
              <Text className="text-xs text-neutral-500">
                Cancela cuando quieras
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-neutral-100 bg-white px-6 pb-6 pt-4">
        <Pressable
          onPress={() => mainPlan && handlePurchase(mainPlan)}
          disabled={isPurchasing || !mainPlan || havePlan}
          className="bg-secondary-default h-14 items-center justify-center rounded-full disabled:opacity-50"
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color={COLORS.neutral.white} />
          ) : (
            <Text className="text-base font-bold text-neutral-white">
              {havePlan ? 'Tienes un plan activo' : 'Comenzar prueba gratis'}
            </Text>
          )}
        </Pressable>
        {!havePlan && (
          <Text className="mt-3 text-center text-xs text-neutral-400">
            7 días gratis, luego {mainPlan?.product.priceString}/mes
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
