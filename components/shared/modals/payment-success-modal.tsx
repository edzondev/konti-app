import { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { COLORS } from '@/constants/colors';

type PaymentSuccessModalProps = {
  visible: boolean;
};

export function PaymentSuccessModal({ visible }: PaymentSuccessModalProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [visible, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <Animated.View
          style={animatedStyle}
          className="w-full max-w-sm items-center rounded-3xl bg-white p-8"
        >
          <View className="bg-success-light/20 mb-6 h-20 w-20 items-center justify-center rounded-full">
            <Check size={48} color={COLORS.success.default} />
          </View>

          <Text className="text-success-default mb-3 text-center text-2xl font-bold">
            ¡Pago exitoso!
          </Text>

          <Text className="text-success-muted text-center leading-relaxed">
            Tu suscripción ha sido activada correctamente
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
