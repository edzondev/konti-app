import React, { PropsWithChildren, useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ViewProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  transparent?: boolean;
};

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
      overlayOpacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      modalScale.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      modalOpacity.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      overlayOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
      modalScale.value = withTiming(0.9, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
      modalOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible, overlayOpacity, modalScale, modalOpacity]);

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
    overlayOpacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.cubic),
    });
    modalScale.value = withTiming(0.9, {
      duration: 200,
      easing: Easing.in(Easing.cubic),
    });
    modalOpacity.value = withTiming(
      0,
      {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          scheduleOnRN(onClose);
        }
      },
    );
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
        className="flex-1 items-center justify-center bg-black/50"
      >
        <Pressable
          className="flex-1 items-center justify-center"
          onPress={handleClose}
        >
          <Animated.View
            style={[modalAnimatedStyle]}
            className="mx-6 rounded-2xl bg-white p-6 shadow-lg"
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

type ModalHeaderProps = {
  title: string;
  onClose?: () => void;
};

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose }) => {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <Text className="text-xl font-semibold text-neutral-foreground">
        {title}
      </Text>
      {onClose && (
        <TouchableOpacity onPress={onClose}>
          <Text className="text-lg text-neutral-muted">✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

type ModalContentProps = ViewProps & PropsWithChildren;

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  ...props
}) => {
  return (
    <View className="mb-6" {...props}>
      {children}
    </View>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => {
  return <View className="flex-row justify-end gap-3">{children}</View>;
};
