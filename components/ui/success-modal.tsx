import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { Modal, ModalContent } from "./modal";
import { COLORS } from "@/constants/colors";
import { Check } from "@/constants/icons";

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title = "¡Registro exitoso!",
  message = "Cuenta creada. Ahora estas listo para usar KONTI!",
  buttonText = "Continuar",
}) => {
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Simple bounce effect for the check icon
      iconScale.value = withDelay(
        300, // Wait a bit after modal appears
        withSequence(
          withSpring(1.1, { damping: 10, stiffness: 200 }),
          withSpring(1, { damping: 8, stiffness: 150 }),
        ),
      );
    } else {
      iconScale.value = 1;
    }
  }, [visible]);

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
          className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/10"
        >
          <Check size={30} color={COLORS.primary} />
        </Animated.View>

        <Text className="mb-2 text-center text-xl font-semibold text-neutral-foreground">
          {title}
        </Text>

        <ModalContent>
          <Text className="text-center text-base leading-6 text-muted-foreground">
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
