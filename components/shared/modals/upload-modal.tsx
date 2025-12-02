import { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type UploadModalProps = {
  visible: boolean;
};

export function UploadModal({ visible }: UploadModalProps) {
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      opacity.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
      rotation.value = 0;
    }
  }, [visible, opacity, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
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
          <Animated.View
            style={spinnerStyle}
            className="border-t-primary-default mb-6 h-20 w-20 items-center justify-center rounded-full border-4 border-gray-200"
          />

          <Text className="mb-3 text-center text-xl font-semibold text-neutral-foreground">
            Procesando documento...
          </Text>

          <Text className="text-neutral-muted text-center text-base">
            Por favor espera un momento
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}
