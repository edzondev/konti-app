import { View, Text, Pressable } from 'react-native';
import { DocumentType } from '@/types/ai-extraction.types';
import { useState } from 'react';
import { DocumentTypeCorrectionModal } from './document-type-correction-modal';
import { FormLabel } from '@/components/ui/form';

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
      <View className="flex-row items-center">
        <FormLabel className="text-base text-muted-foreground">
          Tipo de comprobante:{' '}
          <Text className="font-normal text-neutral-foreground">
            {typeLabel}
          </Text>
        </FormLabel>
        {!disabled && (
          <Pressable onPress={handleEdit} className="ml-2">
            {({ pressed }) => (
              <Text
                className="text-base font-medium text-primary"
                style={{ opacity: pressed ? 0.6 : 1 }}
              >
                Editar
              </Text>
            )}
          </Pressable>
        )}
      </View>

      <DocumentTypeCorrectionModal
        visible={isModalVisible}
        currentType={value}
        onSelect={handleTypeSelect}
        onClose={() => setIsModalVisible(false)}
      />
    </>
  );
}
