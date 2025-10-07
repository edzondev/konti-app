import React, { useEffect } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { COLORS } from "@/constants/colors";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  transparent?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  transparent = true,
}) => {
  const overlayOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 250 });
      modalScale.value = withSpring(1, {
        damping: 20,
        stiffness: 200,
      });
      modalOpacity.value = withTiming(1, { duration: 250 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
      modalOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: modalScale.value }],
      opacity: modalOpacity.value,
    };
  });

  const handleClose = () => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    modalScale.value = withTiming(0.9, { duration: 200 });
    modalOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  return (
    <RNModal
      visible={visible}
      transparent={transparent}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[overlayAnimatedStyle]}
        className="flex-1 justify-center items-center bg-black/50"
      >
        <Pressable
          className="flex-1 justify-center items-center"
          onPress={handleClose}
        >
          <Animated.View
            style={[modalAnimatedStyle]}
            className="bg-white rounded-2xl mx-6 p-6 shadow-lg"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {children}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </RNModal>
  );
};

interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose }) => {
  return (
    <View className="flex-row justify-between items-center mb-4">
      <Text className="text-xl font-semibold text-neutral-foreground">
        {title}
      </Text>
      {onClose && (
        <TouchableOpacity onPress={onClose}>
          <Text className="text-lg text-muted-foreground">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface ModalContentProps {
  children: React.ReactNode;
}

export const ModalContent: React.FC<ModalContentProps> = ({ children }) => {
  return <View className="mb-6">{children}</View>;
};

interface ModalFooterProps {
  children: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => {
  return <View className="flex-row gap-3 justify-end">{children}</View>;
};