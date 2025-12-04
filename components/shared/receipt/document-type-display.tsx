import { View, Text, Pressable } from 'react-native';
import { FileText, ChevronRight } from 'lucide-react-native';
import { DocumentType } from '@/types/ai-extraction.types';
import { useState } from 'react';
import { DocumentTypeCorrectionModal } from './document-type-correction-modal';
import { COLORS } from '@/constants/colors';

type DocumentTypeDisplayProps = {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
  disabled?: boolean;
};

export default function DocumentTypeDisplay({
  value,
  onChange,
  disabled = false,
}: DocumentTypeDisplayProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const typeLabel = value === 'boleta' ? 'Boleta' : 'Factura';

  const handleEdit = () => {
    if (!disabled) {
      setIsModalVisible(true);
    }
  };

  const handleTypeSelect = (type: DocumentType) => {
    onChange(type);
    setIsModalVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={handleEdit}
        disabled={disabled}
        className="flex-row items-center justify-between rounded-2xl bg-neutral-50 p-4 active:bg-neutral-100 disabled:opacity-60"
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-default/10">
            <FileText size={20} color={COLORS.primary.default} />
          </View>
          <View>
            <Text className="text-xs font-medium text-neutral-400">
              Tipo de comprobante
            </Text>
            <Text className="text-base font-semibold text-neutral-900">
              {typeLabel}
            </Text>
          </View>
        </View>

        {!disabled && (
          <View className="flex-row items-center gap-1">
            <Text className="text-sm font-medium text-primary-default">
              Cambiar
            </Text>
            <ChevronRight size={16} color={COLORS.primary.default} />
          </View>
        )}
      </Pressable>

      <DocumentTypeCorrectionModal
        visible={isModalVisible}
        currentType={value}
        onSelect={handleTypeSelect}
        onClose={() => setIsModalVisible(false)}
      />
    </>
  );
}
