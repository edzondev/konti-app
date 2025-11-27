import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Modal, ModalContent } from './modal';
import { COLORS } from '@/constants/colors';
import { Check } from 'lucide-react-native';

type SuccessModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
};

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title = '¡Registro exitoso!',
  message = 'Cuenta creada. Ahora estas listo para usar KONTI!',
  buttonText = 'Continuar',
}) => {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      iconScale.value = withDelay(
        300, // Wait a bit after modal appears
        withSequence(
          withTiming(1.1, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(1, {
            duration: 200,
            easing: Easing.out(Easing.cubic),
          }),
        ),
      );
    } else {
      iconScale.value = 1;
    }
  }, [visible, iconScale]);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }],
    };
  });

  return (
    <Modal visible={visible} onClose={onClose}>
      <View className="items-center">
        <Animated.View
          style={[iconAnimatedStyle]}
          className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-primary/10"
        >
          <Check size={40} color={COLORS.primary} />
        </Animated.View>

        <Text className="mb-2 text-center text-lg font-semibold text-neutral-foreground">
          {title}
        </Text>

        <ModalContent>
          <Text className="text-center text-sm leading-5 text-muted-foreground">
            {message}
          </Text>
        </ModalContent>

        <TouchableOpacity
          onPress={onClose}
          className="w-full rounded-lg bg-primary px-8 py-3"
        >
          <Text className="text-center text-base font-semibold text-white">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
