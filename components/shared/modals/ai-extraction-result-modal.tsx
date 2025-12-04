import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Modal, ModalContent } from '@/components/ui/modal';
import { COLORS } from '@/constants/colors';
import { Check, X } from 'lucide-react-native';

type AiExtractionResultModalProps = {
  visible: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
  buttonText?: string;
};

export const AiExtractionResultModal: React.FC<
  AiExtractionResultModalProps
> = ({ visible, onClose, type, title, message, buttonText = 'Entendido' }) => {
  const Icon = type === 'success' ? Check : X;
  const iconColor =
    type === 'success' ? COLORS.primary.default : COLORS.destructive.default;
  const bgColor =
    type === 'success' ? 'bg-primary-default/10' : 'bg-destructive-default/10';

  return (
    <Modal visible={visible} onClose={onClose}>
      <View className="min-w-[300px] items-center">
        <View
          className={`h-20 w-20 items-center justify-center rounded-full ${bgColor}`}
        >
          <Icon size={40} color={iconColor} />
        </View>

        <ModalContent className="my-6 flex-col items-center gap-2">
          <Text className="text-center text-2xl font-semibold text-neutral-foreground">
            {title}
          </Text>

          <Text className="text-center text-base leading-6 text-neutral-muted">
            {message}
          </Text>
        </ModalContent>

        <TouchableOpacity
          onPress={onClose}
          className="w-full rounded-lg bg-primary-default px-8 py-3 active:opacity-90"
        >
          <Text className="text-center text-base font-semibold text-neutral-white">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};
