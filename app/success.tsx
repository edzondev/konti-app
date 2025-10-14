import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Check } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { Link } from 'expo-router';

export default function Success() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <View className="mx-auto px-6">
        <View className="mb-8 flex-row items-center justify-center">
          <Animated.View
            style={animatedStyle}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
          >
            <Check size={40} color={COLORS.primary} />
          </Animated.View>
        </View>

        <Text className="font-regular mb-3 text-center text-2xl font-light text-neutral-foreground">
          Boleta guardada
        </Text>
        <Text className="font-regular mb-12 text-center text-base font-light text-muted-foreground">
          Tu comprobante ha sido registrado exitosamente
        </Text>

        <Link href="/(tabs)" asChild dismissTo>
          <Pressable className="flex-row items-center justify-center rounded-lg bg-primary py-3 text-white">
            <Text className="font-regular text-white">Continuar</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
