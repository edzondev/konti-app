import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboardingStore } from '@/store/use-onboarding-store';

export default function Welcome() {
  const router = useRouter();
  const { hasSeenOnboarding } = useOnboardingStore();

  const handleGetStarted = () => {
    if (!hasSeenOnboarding) {
      router.push('/(auth)/onboarding');
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 justify-between px-8 py-12">
        <View className="flex-1 items-center justify-center">
          <View className="mb-12">
            <View className="relative h-48 w-48 items-center justify-center">
              <Image
                source={require('@/assets/konti_logo.png')}
                style={{ width: 192, height: 192 }}
                resizeMode="contain"
                alt="Konti"
              />
            </View>
          </View>

          <View className="items-center gap-y-3">
            <Text className="text-center text-3xl font-bold leading-tight text-gray-900">
              Digitaliza tus Recibos con Konti
            </Text>

            <Text className="text-center text-xl leading-relaxed text-gray-600">
              Escanea, extrae datos con IA y olvídate del papel.
            </Text>
          </View>
        </View>

        <View className="gap-y-4">
          <TouchableOpacity
            onPress={handleGetStarted}
            className="items-center justify-center rounded-2xl bg-primary py-5 shadow-lg"
            activeOpacity={0.8}
          >
            <Text className="text-lg font-semibold text-white">Empezar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
