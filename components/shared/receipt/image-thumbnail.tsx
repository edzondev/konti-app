import { View, Pressable, ActivityIndicator, Text } from 'react-native';
import { useState } from 'react';
import { Maximize2, WandSparkles } from 'lucide-react-native';
import ImageComponent from '@/components/ui/image';
import { COLORS } from '@/constants/colors';

type ImageThumbnailProps = {
  imageUrl: string;
  onPress: () => void;
  onAiPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showAiButton?: boolean;
  isAiLoading?: boolean;
  aiButtonText?: string;
};

type SizeConfig = {
  height: number;
  width: number;
};

const SIZE_MAP: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: { height: 150, width: 120 },
  md: { height: 400, width: 350 },
  lg: { height: 350, width: 280 },
};

export default function ImageThumbnail({
  imageUrl,
  onPress,
  onAiPress,
  size = 'md',
  showAiButton = false,
  isAiLoading = false,
  aiButtonText = 'Procesar con IA',
}: ImageThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const dimensions = SIZE_MAP[size];

  return (
    <View className="items-center">
      <Pressable
        onPress={onPress}
        className="relative overflow-hidden rounded-2xl border-2 border-neutral-border bg-muted-foreground/5 active:opacity-80"
        style={dimensions}
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
          <View className="absolute inset-0 items-center justify-center bg-muted-foreground/10">
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}

        <View className="absolute right-2 top-2 rounded-full bg-black/50 p-2">
          <Maximize2 size={22} color={COLORS.neutral.white} strokeWidth={2.5} />
        </View>

        {showAiButton && onAiPress && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onAiPress();
            }}
            disabled={isAiLoading}
            className="absolute bottom-2.5 left-2.5 flex-row items-center justify-center gap-2 rounded-full border border-secondary bg-secondary/60 p-2 active:scale-95 active:opacity-85 disabled:opacity-60"
            aria-label="Procesar con IA"
          >
            {isAiLoading ? (
              <ActivityIndicator size="small" color={COLORS.neutral.white} />
            ) : (
              <>
                <WandSparkles
                  size={22}
                  color={COLORS.neutral.white}
                  strokeWidth={2}
                />
                <Text className="text-base font-medium text-neutral-white">
                  {aiButtonText}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}
