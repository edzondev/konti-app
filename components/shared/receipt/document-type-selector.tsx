import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { DocumentType } from '@/types/ai-extraction.types';
import { cn } from '@/lib/utils';

type DocumentTypeSelectorProps = {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
  disabled?: boolean;
};

const ANIMATION_DURATION = 200;
const INDICATOR_WIDTH_PERCENT = 50;

export default function DocumentTypeSelector({
  value,
  onChange,
  disabled = false,
}: DocumentTypeSelectorProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(value === 'factura' ? 1 : 0, {
      duration: ANIMATION_DURATION,
    });
  }, [value, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 100 }],
  }));

  return (
    <View className="mb-6">
      <Text className="mb-2 text-sm font-medium text-neutral-foreground">
        Tipo de comprobante
      </Text>
      <View className="relative flex-row overflow-hidden rounded-lg border border-neutral-border bg-white">
        <Animated.View
          style={[indicatorStyle, { width: `${INDICATOR_WIDTH_PERCENT}%` }]}
          className="bg-primary-default absolute left-0 top-0 h-full rounded-lg"
        />

        <Pressable
          onPress={() => !disabled && onChange('boleta')}
          disabled={disabled}
          className="z-10 flex-1 items-center justify-center py-3"
          aria-label="Seleccionar Boleta"
        >
          <Text
            className={cn(
              'text-base font-medium',
              value === 'boleta' ? 'text-neutral-white' : 'text-neutral-muted',
            )}
          >
            Boleta
          </Text>
        </Pressable>

        <Pressable
          onPress={() => !disabled && onChange('factura')}
          disabled={disabled}
          className="z-10 flex-1 items-center justify-center py-3"
          aria-label="Seleccionar Factura"
        >
          <Text
            className={cn(
              'text-base font-medium',
              value === 'factura' ? 'text-neutral-white' : 'text-neutral-muted',
            )}
          >
            Factura
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
