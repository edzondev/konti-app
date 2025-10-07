import { memo, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Check, Crown, Zap } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { Plan } from "@/types/plan.type";

type Props = {
  plan: Plan;
  selectedPlan: string;
  handlePlanSelect: (planId: string) => void;
};

export default memo(function PlanCard({
  plan,
  selectedPlan,
  handlePlanSelect,
}: Props) {
  const isSelected = selectedPlan === plan.id;
  const checkOpacity = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    checkOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 150 });
  }, [isSelected]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const IconComponent = plan.icon;

  return (
    <Pressable onPress={() => handlePlanSelect(plan.id)} className="mb-4">
      <View
        style={[
          {
            backgroundColor: COLORS.neutral.white,
            borderWidth: 2,
            borderColor: isSelected ? COLORS.primary : COLORS.neutral.border,
          },
          isSelected && {
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
        className="relative rounded-3xl p-6 shadow-sm"
      >
        {plan.isPopular && (
          <View
            className="absolute right-4 top-4 rounded-full px-3 py-1"
            style={{ backgroundColor: `${plan.badgeColor}15` }}
          >
            <Text
              style={{ color: plan.badgeColor }}
              className="text-xs font-semibold"
            >
              Más popular
            </Text>
          </View>
        )}

        <View className="mb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="rounded-xl p-3"
                style={{
                  backgroundColor: `${plan.badgeColor}15`,
                }}
              >
                <IconComponent size={24} color={plan.badgeColor} />
              </View>
              <View className="ml-4">
                <Text className="text-lg font-bold text-neutral-foreground">
                  {plan.name}
                </Text>
                <Text
                  className="w-2/3 text-sm font-light text-muted-foreground"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  adjustsFontSizeToFit={false}
                >
                  {plan.description}
                </Text>
              </View>
            </View>
          </View>

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-3xl font-bold text-neutral-foreground">
                {plan.price}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <Text className="mb-3 text-sm font-semibold text-neutral-foreground">
            Features
          </Text>
          {plan.features.map((feature, featureIndex) => (
            <View key={featureIndex} className="mb-2 flex-row items-center">
              <View
                className="h-5 w-5 items-center justify-center rounded-full"
                style={{
                  backgroundColor: `${COLORS.primary}15`,
                }}
              >
                <Check size={12} color={COLORS.primary} />
              </View>
              <Text className="ml-3 text-sm text-muted-foreground">
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {isSelected && (
          <Animated.View
            style={[checkAnimatedStyle, { backgroundColor: COLORS.primary }]}
            className="absolute right-4 top-16 h-6 w-6 items-center justify-center rounded-full shadow-lg"
          >
            <Check size={14} color={COLORS.neutral.white} />
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
});
