import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { X, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import PlanCard from '@/components/shared/suscription/plan-card';
import { usePurchases } from '@/hooks/purchases/use-purchases';
import { usePurchasePackage } from '@/hooks/purchases/use-purchases-package';
import type { PurchasesPackage } from 'react-native-purchases';
import { FlashList } from '@shopify/flash-list';
import { PaymentSuccessModal } from '@/components/shared/modals/payment-success-modal';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useQueryClient } from '@tanstack/react-query';
import { scheduleOnRN } from 'react-native-worklets';

const featureMap = {
  pro: [
    'Hasta 20 boletas por mes',
    'Procesamiento automático con OCR incluido',
    'Exportación mensual en Excel (Proximamente)',
    'Soporte en horario laboral',
  ],
  premium: [
    'Subidas ilimitadas de boletas',
    'Procesamiento automático con OCR incluido',
    'Reporte anual listo para SUNAT',
    'Acceso anticipado a nuevas funciones',
    'Soporte prioritario',
  ],
};

export default function SubscriptionScreen() {
  const { availablePackages, isLoading, refetch, isRefetching } =
    usePurchases();
  const { purchasePackageAsync, isPending: isPurchasing } =
    usePurchasePackage();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const contentOpacity = useSharedValue(0);
  const queryClient = useQueryClient();

  const fadeOut = useSharedValue(1);
  const slideDown = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 300 });
  }, [contentOpacity]);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleClose = () => {
    router.back();
  };

  const animateClose = () => {
    fadeOut.value = withTiming(0, { duration: 300 });
    slideDown.value = withTiming(50, { duration: 300 }, (finished) => {
      if (finished) {
        scheduleOnRN(handleClose);
      }
    });
  };

  const handlePlanSelect = async (plan: PurchasesPackage) => {
    await purchasePackageAsync(plan);
    setShowSuccessModal(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Invalidar perfil para que refetch desde tu DB
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.profile.details,
    });

    // Invalidar datos de purchases también
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.purchases.data,
    });
    setShowSuccessModal(false);
    animateClose();
  };

  return (
    <>
      <PaymentSuccessModal visible={showSuccessModal} />

      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-1 px-6">
          <Animated.View style={[contentAnimatedStyle]} className="flex-1">
            {isLoading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : (
              <FlashList
                data={availablePackages}
                keyExtractor={(item) => item.identifier}
                renderItem={({ item }) => (
                  <PlanCard
                    plan={item}
                    features={
                      featureMap[item.identifier as keyof typeof featureMap]
                    }
                    isPopular={item.product.title.includes('Pro')}
                    onSelect={handlePlanSelect}
                    isLoading={isPurchasing}
                  />
                )}
                onRefresh={() => refetch()}
                refreshing={isRefetching}
                ListHeaderComponent={() => (
                  <View className="pb-6 pt-8">
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        onPress={handleClose}
                        className="rounded-full bg-neutral-border p-2"
                      >
                        <X size={20} color={COLORS.muted.foreground} />
                      </TouchableOpacity>
                      <Text className="text-2xl font-semibold text-neutral-foreground">
                        Planes de suscripción
                      </Text>
                      <View className="w-6" />
                    </View>

                    {/* Free Trial Notice */}
                    <View className="mt-6 flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <View className="rounded-full bg-primary/10 p-2">
                        <Sparkles size={16} color={COLORS.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-neutral-foreground">
                          Obten tu prueba gratis por 3 días
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          Después de la prueba, se te cobrará el plan
                          seleccionado
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </>
  );
}
