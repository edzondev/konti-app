import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

type MessageLimitReachedProps = {
  message: string;
  description?: string;
};

export function MessageLimitReached({
  message,
  description,
}: MessageLimitReachedProps) {
  const handleSubscribe = () => {
    router.push('/subscription');
  };

  return (
    <View className="rounded-xl bg-neutral-border/20 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-col gap-y-2">
          <Text className="text-sm font-medium text-neutral-foreground">
            {message}
          </Text>
          {description && (
            <Text className="text-sm leading-tight text-neutral-muted">
              {description}
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleSubscribe}
          className="rounded-lg bg-secondary-default px-4 py-2 active:opacity-90"
        >
          <Text className="text-sm font-semibold text-white">Obtener Plus</Text>
        </Pressable>
      </View>
    </View>
  );
}
