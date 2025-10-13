import { memo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check, Crown } from "@/constants/icons";
import { COLORS } from "@/constants/colors";
import type { PurchasesPackage } from "react-native-purchases";
import { cn } from "@/lib/utils";

type Props = {
  plan: PurchasesPackage;
  features: string[];
  isPopular: boolean;
  onSelect: (plan: PurchasesPackage) => void;
  isLoading: boolean;
};

export default memo(function PlanCard({
  plan,
  features,
  isPopular,
  onSelect,
  isLoading,
}: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className={cn(
        "relative mb-4 flex-col gap-4 rounded-3xl border-2 border-neutral-border bg-white p-6 shadow-sm",
        isPopular && "border-primary",
      )}
    >
      <View>
        <View className="flex-col gap-4">
          <View className="flex-row items-start justify-between">
            <View className="rounded-full bg-primary/10 p-4">
              <Crown size={24} color={COLORS.primary} />
            </View>
            {isPopular && (
              <View className="rounded-full bg-primary/10 px-3 py-1">
                <Text className="text-xs font-semibold text-primary">
                  Mejor valorado
                </Text>
              </View>
            )}
          </View>
          <View className="gap-2 text-pretty">
            <Text className="text-2xl font-bold text-neutral-foreground">
              {plan.product.title.split("(")[0]}
            </Text>
            <Text
              className="text-base font-light text-muted-foreground"
              numberOfLines={2}
              ellipsizeMode="tail"
              adjustsFontSizeToFit={false}
            >
              {plan.product.description}
            </Text>
          </View>
        </View>

        <View className="mt-2 flex-row items-baseline gap-1">
          <Text className="text-3xl font-bold text-neutral-foreground">
            {plan.product.priceString}
          </Text>
          <Text className="text-base font-normal text-muted-foreground">
            /mes
          </Text>
        </View>
      </View>

      <View>
        <Text className="mb-3 text-sm font-semibold text-neutral-foreground">
          Lo que incluye
        </Text>
        {features.map((feature, featureIndex) => (
          <View key={featureIndex} className="mb-2 flex-row items-center gap-2">
            <Check size={12} color={COLORS.primary} />
            <Text className="text-sm text-muted-foreground">{feature}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => onSelect(plan)}
        className="h-14 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2"
      >
        <Text className="text-lg font-semibold text-white">
          {isLoading ? "Procesando..." : "Seleccionar este plan"}
        </Text>
        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.neutral.white} />
        )}
      </Pressable>
    </Animated.View>
  );
});
