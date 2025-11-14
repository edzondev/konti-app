import { View, Text, Pressable, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { DocumentType } from '@/types/ai-extraction.types';
import { COLORS } from '@/constants/colors';

type DocumentTypeCorrectionModalProps = {
  visible: boolean;
  currentType: DocumentType;
  onSelect: (type: DocumentType) => void;
  onClose: () => void;
};

export function DocumentTypeCorrectionModal({
  visible,
  currentType,
  onSelect,
  onClose,
}: DocumentTypeCorrectionModalProps) {
  const options: { value: DocumentType; label: string }[] = [
    { value: 'boleta', label: 'Boleta' },
    { value: 'factura', label: 'Factura' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/40"
        onPress={onClose}
      >
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          className="mx-6 w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg"
        >
          <Pressable>
            <Text className="mb-6 text-center text-lg font-semibold text-neutral-foreground">
              Seleccionar tipo de comprobante
            </Text>

            <View className="gap-y-3">
              {options.map((option) => {
                const isSelected = currentType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => onSelect(option.value)}
                    className="flex-row items-center justify-between rounded-xl border border-neutral-border bg-white px-5 py-4 active:bg-neutral-50"
                  >
                    <Text
                      className={`text-base ${
                        isSelected
                          ? 'font-semibold text-primary'
                          : 'font-normal text-neutral-foreground'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Animated.View entering={FadeIn.duration(200)}>
                        <Check size={20} color={COLORS.primary} />
                      </Animated.View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
