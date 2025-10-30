import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const calculatePasswordStrength = (password: string) => {
  if (!password) return 0;

  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;

  return strength;
};

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${strength}%`, { duration: 300 }),
    backgroundColor: interpolateColor(
      strength,
      [0, 50, 100],
      ['#ef4444', '#eab308', '#22c55e']
    ),
  }));

  if (!password) return null;

  const strengthText = strength === 0 ? '' : strength < 50 ? 'Débil' : strength < 100 ? 'Media' : 'Segura';

  return (
    <View className="mt-2 gap-y-1">
      <View className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <Animated.View className="h-full rounded-full" style={animatedStyle} />
      </View>
      {strengthText && (
        <Text className={cn(
          'text-xs',
          strength < 50 && 'text-red-500',
          strength >= 50 && strength < 100 && 'text-yellow-500',
          strength === 100 && 'text-green-500'
        )}>
          {strengthText}
        </Text>
      )}
    </View>
  );
}
