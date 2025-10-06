import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";

interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColor?: {
    false: string;
    true: string;
  };
  thumbColor?: string;
  disabled?: boolean;
}

export function AnimatedSwitch({
  value,
  onValueChange,
  trackColor = { false: "#bdbdbd", true: "#007AFF" },
  thumbColor = "#ffffff",
  disabled = false,
}: AnimatedSwitchProps) {
  const switchTranslate = useSharedValue(value ? 1 : 0);
  const switchScale = useSharedValue(1);

  useEffect(() => {
    switchTranslate.value = withSpring(value ? 1 : 0, {
      damping: 20,
      stiffness: 300,
      overshootClamping: true,
    });
  }, [value, switchTranslate]);

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      switchTranslate.value,
      [0, 1],
      [trackColor.false, trackColor.true],
    );

    return {
      backgroundColor,
    };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const translateX = switchTranslate.value * 20;
    const scale = switchScale.value;

    return {
      transform: [{ translateX }, { scale }],
    };
  });

  const handlePress = () => {
    if (disabled) return;

    switchScale.value = withSpring(
      0.95,
      {
        damping: 25,
        stiffness: 400,
        overshootClamping: true,
      },
      () => {
        switchScale.value = withSpring(1, {
          damping: 25,
          stiffness: 400,
          overshootClamping: true,
        });
      },
    );

    onValueChange(!value);
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          {
            width: 50,
            height: 30,
            borderRadius: 15,
            justifyContent: "center",
            paddingHorizontal: 2,
            opacity: disabled ? 0.6 : 1,
          },
          trackAnimatedStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: thumbColor,
            },
            thumbAnimatedStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
