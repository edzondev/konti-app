import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Modal } from '@/components/ui/modal';
import { COLORS } from '@/constants/colors';
import { Sparkles } from 'lucide-react-native';

type AiExtractionLoadingModalProps = {
  visible: boolean;
};

export const AiExtractionLoadingModal: React.FC<
  AiExtractionLoadingModalProps
> = ({ visible }) => {
  return (
    <Modal visible={visible} onClose={() => {}} transparent>
      <View className="min-w-[280px] items-center">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-default/10">
          <Sparkles size={40} color={COLORS.primary.default} />
        </View>

        <View className="mb-4 items-center">
          <Text className="mb-2 text-center text-xl font-semibold text-neutral-foreground">
            Procesando imagen
          </Text>
          <Text className="text-center text-sm leading-5 text-neutral-muted">
            Estamos extrayendo la información de tu comprobante con inteligencia
            artificial
          </Text>
        </View>

        <ActivityIndicator size="small" color={COLORS.primary.default} />
      </View>
    </Modal>
  );
};
