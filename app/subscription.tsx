import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Pressable,
  Keyboard,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { scheduleOnRN } from 'react-native-worklets';

import { COLORS } from '@/constants/colors';
import { QUERY_KEYS } from '@/constants/query-keys';
import { PaymentSuccessModal } from '@/components/shared/modals/payment-success-modal';
import { usePurchases } from '@/hooks/purchases/use-purchases';
import { usePurchasePackage } from '@/hooks/purchases/use-purchases-package';
import { cn } from '@/lib/utils';
import PlanCard from '@/components/shared/suscription/plan-card';

import {
  Aperture,
  Infinity,
  FileText,
  Zap,
  Crown,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
  pro: boolean;
  premium: boolean;
  isAvailableInFuture?: boolean;
};

const BASE_FEATURES: Feature[] = [
  {
    icon: Zap,
    title: 'Extracción de Datos con IA',
    description:
      'Procesamiento automático para obtener RUC, monto total y fecha en segundos.',
    pro: true,
    premium: true,
  },
  {
    icon: ShieldCheck,
    title: 'Clasificación Contable Automática',
    description:
      'La IA identifica si tu boleta es contable (de gasto) para una mejor organización.',
    pro: true,
    premium: true,
  },
  {
    icon: FileText,
    title: 'Reportes y Exportación',
    description: 'Genera reportes y exporta tus datos en Excel mensualmente.',
    pro: true,
    premium: true,
    isAvailableInFuture: true,
  },
];

const PRO_UPGRADE_FEATURES: Feature[] = [
  {
    icon: Aperture,
    title: 'Límite de Carga Ampliado',
    description: 'Sube hasta 20 boletas por mes.',
    pro: true,
    premium: true,
  },
  {
    icon: ShieldCheck,
    title: 'Asistencia Estándar',
    description: 'Soporte técnico disponible en horario laboral.',
    pro: true,
    premium: true,
  },
];

const PREMIUM_EXCLUSIVE_FEATURES: Feature[] = [
  {
    icon: Infinity,
    title: 'Subidas Ilimitadas',
    description: 'Olvídate de los límites: carga boletas sin restricciones.',
    pro: false,
    premium: true,
  },
  {
    icon: Crown,
    title: 'Reporte Fiscal SUNAT',
    description:
      'Genera un reporte anual consolidado, listo para tus declaraciones.',
    pro: false,
    premium: true,
    isAvailableInFuture: true,
  },
  {
    icon: Zap,
    title: 'Soporte VIP Prioritario',
    description: 'Respuesta inmediata a tus consultas con prioridad absoluta.',
    pro: false,
    premium: true,
  },
  {
    icon: Aperture,
    title: 'Acceso Exclusivo',
    description:
      'Sé el primero en probar nuevas funciones antes de su lanzamiento oficial.',
    pro: false,
    premium: true,
  },
];

const ALL_FEATURES = [
  ...BASE_FEATURES,
  ...PRO_UPGRADE_FEATURES,
  ...PREMIUM_EXCLUSIVE_FEATURES,
];

export default function SubscriptionScreen() {
  const { fromPreview, imageUrl } = useLocalSearchParams<{
    fromPreview?: string;
    imageUrl?: string;
  }>();
  const { availablePackages, isLoading } = usePurchases();
  const { purchasePackageAsync, isPending: isPurchasing } =
    usePurchasePackage();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const contentOpacity = useSharedValue(0);
  const queryClient = useQueryClient();

  const fadeOut = useSharedValue(1);
  const slideDown = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 300 });
  }, [contentOpacity]);

  // Auto-select annual plan by default
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

  const animateClose = useCallback(() => {
    fadeOut.value = withTiming(0, { duration: 300 });
    slideDown.value = withTiming(50, { duration: 300 }, (finished) => {
      if (finished) {
        scheduleOnRN(handleClose);
      }
    });
  }, [fadeOut, slideDown, handleClose]);

  const handlePurchase = useCallback(
    async (plan: PurchasesPackage) => {
      console.log('[Purchase] Purchasing plan:', plan);
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

        if (fromPreview === 'true' && imageUrl) {
          router.replace({
            pathname: '/preview',
            params: { imageUrl },
          });
        } else {
          animateClose();
        }
      } catch (error) {
        console.log('[Purchase] Cancelled or failed:', error);
      }
    },
    [fromPreview, imageUrl, purchasePackageAsync, queryClient, animateClose],
  );

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
