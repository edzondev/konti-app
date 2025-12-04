import { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import { Crown } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { COLORS } from '@/constants/colors';

type SinglePlanCardProps = {
  plan: PurchasesPackage;
  havePlan: boolean;
};

function SinglePlanCardComponent({ plan, havePlan }: SinglePlanCardProps) {
  const planName = useMemo(
    () => plan.product.title.split('(')[0].trim(),
    [plan.product.title],
  );

  const price = useMemo(
    () => plan.product.priceString,
    [plan.product.priceString],
  );

  return (
    <View className="overflow-hidden rounded-3xl bg-gradient-to-br">
      <View className="absolute inset-0 bg-secondary-default" />
      <View className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10" />
      <View className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />

      <View className="relative p-6">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 rounded-full bg-white/20 px-3 py-1.5">
            <Crown size={14} color={COLORS.neutral.white} />
            <Text className="text-xs font-semibold text-white">
              {havePlan ? 'Plan Actual' : 'Plan Recomendado'}
            </Text>
          </View>
        </View>

        <Text className="mb-2 text-2xl font-bold text-white">{planName}</Text>

        <View className="mb-4 flex-row items-baseline gap-1">
          <Text className="text-4xl font-extrabold text-white">{price}</Text>
          <Text className="text-base font-medium text-white/70">/mes</Text>
        </View>

        {!havePlan && (
          <View className="rounded-2xl bg-white/15 p-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-semibold text-white">
                7 días de prueba gratis
              </Text>
            </View>
            <Text className="mt-1 text-xs text-white/70">
              Cancela en cualquier momento. Sin compromisos.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export const SinglePlanCard = memo(SinglePlanCardComponent);
