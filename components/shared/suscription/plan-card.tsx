import { memo, useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { cn } from '@/lib/utils';

type PlanCardProps = {
  plan: PurchasesPackage;
  isSelected: boolean;
  onSelect: () => void;
  emoji: string;
  discount?: string;
};

const ANIMATION_CONFIG = {
  selected: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  },
  unselected: {
    duration: 250,
    easing: Easing.out(Easing.ease),
  },
} as const;

const ANIMATION_VALUES = {
  selected: { opacity: 1, translateX: 0, borderWidth: 2 },
  unselected: { opacity: 0, translateX: -1, borderWidth: 1 },
} as const;

function PlanCard({
  plan,
  isSelected,
  onSelect,
  emoji,
  discount,
}: PlanCardProps) {
  const checkOpacity = useSharedValue(
    isSelected
      ? ANIMATION_VALUES.selected.opacity
      : ANIMATION_VALUES.unselected.opacity,
  );
  const textTranslateX = useSharedValue(
    isSelected
      ? ANIMATION_VALUES.selected.translateX
      : ANIMATION_VALUES.unselected.translateX,
  );
  const borderWidth = useSharedValue(
    isSelected
      ? ANIMATION_VALUES.selected.borderWidth
      : ANIMATION_VALUES.unselected.borderWidth,
  );

  const planName = useMemo(
    () => plan.product.title.split('(')[0].trim(),
    [plan.product.title],
  );

  const price = useMemo(
    () => plan.product.priceString,
    [plan.product.priceString],
  );

  useEffect(() => {
    const config = isSelected
      ? ANIMATION_CONFIG.selected
      : ANIMATION_CONFIG.unselected;

    const values = isSelected
      ? ANIMATION_VALUES.selected
      : ANIMATION_VALUES.unselected;

    textTranslateX.value = withTiming(values.translateX, config);
    checkOpacity.value = withTiming(values.opacity, config);
    borderWidth.value = withTiming(values.borderWidth, config);
  }, [isSelected, textTranslateX, checkOpacity, borderWidth]);

  const checkAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: checkOpacity.value,
    }),
    [],
  );

  const textAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: textTranslateX.value }],
    }),
    [],
  );

  const cardAnimatedStyle = useAnimatedStyle(
    () => ({
      borderWidth: borderWidth.value,
    }),
    [],
  );

  return (
    <View className="flex-1">
      <Pressable onPress={onSelect}>
        <Animated.View
          style={cardAnimatedStyle}
          className={cn(
            'relative rounded-3xl bg-white p-6',
            isSelected
              ? 'border-secondary shadow-lg'
              : 'border-secondary/20 shadow-sm',
          )}
        >
          {discount && (
            <View className="absolute right-3 top-3 rounded-full bg-green-100 px-3 py-1">
              <Text className="text-xs font-bold text-green-700">
                {discount}
              </Text>
            </View>
          )}

          <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
            <Text className="text-3xl">{emoji}</Text>
          </View>

          <View className="mb-1 flex-row items-center gap-2">
            {isSelected && (
              <Animated.View
                style={checkAnimatedStyle}
                className="h-5 w-5 items-center justify-center rounded-full bg-green-500"
              >
                <Check size={14} color="white" strokeWidth={3} />
              </Animated.View>
            )}
            <Animated.View style={textAnimatedStyle}>
              <Text className="text-xl font-bold text-neutral-900">
                {planName}
              </Text>
            </Animated.View>
          </View>

          <Text className="text-3xl font-bold text-neutral-900">{price}</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default memo(PlanCard);
