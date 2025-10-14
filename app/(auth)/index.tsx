import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-purple-200" edges={['top']}>
      <View className="flex-1 justify-end">
        <View className="h-96 w-full items-center rounded-3xl bg-white px-6 py-8">
          <View className="flex-auto flex-col justify-around">
            <View className="flex-col items-center gap-y-4">
              <Text className="text-center text-3xl font-semibold text-neutral-foreground">
                Maneja tus gastos contables con KONTI! 🎉
              </Text>

              <Text className="text-center text-base text-muted-foreground">
                Escanea tus boletas, extrae información y guardalas de forma
                segura.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="flex-row items-center justify-center rounded-full bg-primary py-5"
            >
              <Text className="text-lg font-semibold text-white">
                Empecemos!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
