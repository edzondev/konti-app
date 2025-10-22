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
          <View className="mb-12 items-center">
            <View className="relative h-72 w-72">
              <Image
                source={require('@/assets/adaptive-icon.png')}
                className="h-full w-full"
                resizeMode="contain"
                alt="Konti"
              />
            </View>
          </View>

          <View className="items-center gap-y-3">
            <Text className="text-center text-4xl font-bold leading-tight text-gray-900">
              Controla tus boletas
            </Text>

            <Text className="text-center text-base leading-relaxed text-gray-600">
              Guarda y organiza tus boletas electrónicas fácilmente con Konti.
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

          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            className="items-center justify-center py-3"
            activeOpacity={0.6}
          >
            <Text className="text-base font-medium text-gray-700">
              ¿Ya tienes cuenta?{' '}
              <Text className="font-bold text-primary">Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
