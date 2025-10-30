import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { cn } from '@/lib/utils';

interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
  IconOutline: LucideIcon;
  IconFilled: LucideIcon;
}

export function TabBarIcon({
  focused,
  color,
  size,
  IconOutline,
  IconFilled,
}: TabBarIconProps) {
  const dotStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 1 : 0, { duration: 200 }),
  }));

  const Icon = focused ? IconFilled : IconOutline;

  return (
    <View className="items-center justify-center gap-1">
      <Icon color={color} size={size} />
      <Animated.View
        style={dotStyle}
        className={cn('h-1.5 w-1.5 rounded-full', focused && 'bg-primary')}
      />
    </View>
  );
}
