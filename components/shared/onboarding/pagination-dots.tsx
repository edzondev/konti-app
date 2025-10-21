import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

interface PaginationDotsProps {
  total: number;
  scrollX: SharedValue<number>;
  width: number;
}

export function PaginationDots({ total, scrollX, width }: PaginationDotsProps) {
  return (
    <View className="flex-row gap-x-2">
      {Array.from({ length: total }).map((_, index) => (
        <Dot key={index} index={index} scrollX={scrollX} width={width} />
      ))}
    </View>
  );
}

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}

function Dot({ index, scrollX, width }: DotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );

    return {
      width: dotWidth,
      opacity,
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className="h-2 rounded-full bg-primary"
    />
  );
}
