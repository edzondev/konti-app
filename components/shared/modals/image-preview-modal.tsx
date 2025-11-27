import { Modal, Pressable, View } from 'react-native';
import { X } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useEffect } from 'react';
import ImageComponent from '@/components/ui/image';
import { COLORS } from '@/constants/colors';

type ImagePreviewModalProps = {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const FADE_IN_DURATION = 250;
const FADE_OUT_DURATION = 200;

export function ImagePreviewModal({
  visible,
  imageUrl,
  onClose,
}: ImagePreviewModalProps) {
  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: FADE_IN_DURATION });
      scale.value = MIN_SCALE;
      savedScale.value = MIN_SCALE;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    } else {
      opacity.value = withTiming(0, { duration: FADE_OUT_DURATION });
    }
  }, [visible]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      'worklet';
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE);
        savedScale.value = MAX_SCALE;
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .averageTouches(true)
    .onUpdate((event) => {
      'worklet';
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={backdropStyle} className="flex-1 bg-black/95">
          <Pressable
            onPress={onClose}
            className="absolute left-6 top-14 z-20 h-12 w-12 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
            aria-label="Cerrar vista previa"
          >
            <X size={24} color={COLORS.neutral.white} />
          </Pressable>

          <GestureDetector gesture={composed}>
            <Animated.View
              style={[animatedStyle, { flex: 1 }]}
              collapsable={false}
            >
              <View style={{ flex: 1 }} pointerEvents="none">
                <ImageComponent
                  src={imageUrl}
                  contentFit="contain"
                  alt="Vista previa del comprobante"
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
