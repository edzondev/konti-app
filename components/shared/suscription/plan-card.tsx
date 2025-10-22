import { memo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Check, Crown } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import type { PurchasesPackage } from 'react-native-purchases';
import { cn } from '@/lib/utils';

type Props = {
  plan: PurchasesPackage;
  features: string[];
  isPopular: boolean;
  onSelect: (plan: PurchasesPackage) => void;
  isLoading: boolean;
  currentUserPlan?: string;
};

export default memo(function PlanCard({
  plan,
  features,
  isPopular,
  onSelect,
  isLoading,
  currentUserPlan,
}: Props) {
  // Determine if this is the user's current plan
  const isCurrentPlan = Boolean(
    currentUserPlan && plan.identifier === currentUserPlan,
  );

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className={cn(
        'relative mb-4 overflow-hidden rounded-2xl bg-white',
        isPopular
          ? 'border-2 border-primary shadow-lg'
          : 'border border-neutral-border/50 shadow-sm',
      )}
    >
      {/* Badge superior */}
      {isPopular && (
        <View className="bg-primary px-4 py-2">
          <Text className="text-center text-xs font-semibold uppercase tracking-wide text-white">
            Mejor valorado
          </Text>
        </View>
      )}

      <View className="p-6">
        {/* Header con título y precio */}
        <View className="mb-6 flex-col gap-3">
          <View className="flex-row items-center gap-3">
            <View
              className={cn(
                'rounded-xl p-2.5',
                isPopular ? 'bg-primary/10' : 'bg-neutral-100',
              )}
            >
              <Crown
                size={20}
                color={isPopular ? COLORS.primary : COLORS.neutral.foreground}
              />
            </View>
            <Text className="text-xl font-bold text-neutral-foreground">
              {plan.product.title.split('(')[0]}
            </Text>
          </View>

          <View className="flex-row items-end gap-1">
            <Text className="text-4xl font-bold text-neutral-foreground">
              {plan.product.priceString}
            </Text>
            <Text className="mb-1 text-sm text-muted-foreground">/mes</Text>
          </View>

          <Text
            className="text-sm leading-5 text-muted-foreground"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {plan.product.description}
          </Text>
        </View>

        {/* Divider */}
        <View className="mb-6 h-px bg-neutral-border" />

        {/* Features */}
        <View className="mb-6 gap-3">
          {features.map((feature, featureIndex) => (
            <View key={featureIndex} className="flex-row items-start gap-2.5">
              <View className="mt-0.5 rounded-full bg-primary/10 p-1">
                <Check size={10} color={COLORS.primary} strokeWidth={3} />
              </View>
              <Text className="flex-1 text-sm leading-5 text-neutral-foreground">
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <Pressable
          onPress={() => onSelect(plan)}
          disabled={isLoading || isCurrentPlan}
          className={cn(
            'h-12 flex-row items-center justify-center gap-2 rounded-xl',
            isCurrentPlan
              ? 'border border-neutral-border/50 bg-neutral-100'
              : isPopular
                ? 'bg-primary'
                : 'border border-primary/20 bg-primary/5',
          )}
        >
          <Text
            className={cn(
              'text-base font-semibold',
              isCurrentPlan
                ? 'text-muted-foreground'
                : isPopular
                  ? 'text-white'
                  : 'text-primary',
            )}
          >
            {isLoading
              ? 'Procesando...'
              : isCurrentPlan
                ? 'Plan actual'
                : 'Seleccionar plan'}
          </Text>
          {isLoading && !isCurrentPlan && (
            <ActivityIndicator
              size="small"
              color={isPopular ? COLORS.neutral.white : COLORS.primary}
            />
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
});
