import { View, Pressable, ActivityIndicator, Text } from 'react-native';
import { useState } from 'react';
import { Maximize2, Sparkles } from 'lucide-react-native';
import ImageComponent from '@/components/ui/image';
import { COLORS } from '@/constants/colors';

type ImageThumbnailProps = {
  imageUrl: string;
  onPress: () => void;
  onAiPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  isAiLoading?: boolean;
  aiButtonText?: string;
};

type SizeConfig = {
  height: number;
  borderRadius: number;
};

const SIZE_MAP: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: { height: 150, borderRadius: 16 },
  md: { height: 280, borderRadius: 20 },
  lg: { height: 350, borderRadius: 24 },
};

export default function ImageThumbnail({
  imageUrl,
  onPress,
  onAiPress,
  size = 'md',
  isAiLoading = false,
  aiButtonText = 'Procesar imagen',
}: ImageThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const dimensions = SIZE_MAP[size];

  return (
    <View className="w-full">
      <View
        className="w-full overflow-hidden bg-neutral-100"
        style={{
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Pressable
          onPress={onPress}
          className="flex-1 active:opacity-95"
          aria-label="Ver imagen completa"
        >
          <ImageComponent
            src={imageUrl}
            contentFit="cover"
            alt="Miniatura del comprobante"
            style={{ width: '100%', height: '100%' }}
            onLoadEnd={() => setIsLoading(false)}
          />

          {isLoading && (
            <View className="absolute inset-0 items-center justify-center bg-neutral-100">
              <ActivityIndicator size="small" color={COLORS.primary.default} />
            </View>
          )}

          <View className="absolute right-3 top-3">
            <View className="rounded-full bg-black/40 p-2.5 backdrop-blur-sm">
              <Maximize2
                size={18}
                color={COLORS.neutral.white}
                strokeWidth={2.5}
              />
            </View>
          </View>
        </Pressable>
      </View>

      <View className="mt-4">
        <Pressable
          onPress={onAiPress}
          disabled={isAiLoading}
          className="bg-secondary-default flex-row items-center justify-center gap-2 rounded-2xl py-4 active:scale-[0.98] active:opacity-90 disabled:opacity-60"
        >
          {isAiLoading ? (
            <>
              <ActivityIndicator size="small" color={COLORS.neutral.white} />
              <Text className="text-base font-semibold text-white">
                Procesando...
              </Text>
            </>
          ) : (
            <>
              <Sparkles
                size={16}
                color={COLORS.neutral.white}
                strokeWidth={2}
              />
              <Text className="text-base font-semibold text-white">
                {aiButtonText}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
