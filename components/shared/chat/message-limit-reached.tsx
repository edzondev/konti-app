import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export function MessageLimitReached() {
  const handleSubscribe = () => {
    router.push('/subscription');
  };

  return (
    <View className="rounded-xl bg-neutral-border/20 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-sm text-neutral-foreground">
            Has alcanzado tu límite de mensajes.{' '}
            <Text className="text-neutral-muted">
              Actualiza a Konti Plus o intenta más tarde.
            </Text>
          </Text>
        </View>
        <Pressable
          onPress={handleSubscribe}
          className="bg-secondary-default rounded-lg px-4 py-2 active:opacity-90"
        >
          <Text className="text-sm font-semibold text-white">Obtener Plus</Text>
        </Pressable>
      </View>
    </View>
  );
}
