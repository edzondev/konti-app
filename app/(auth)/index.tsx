import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ArrowRight, Check } from 'lucide-react-native';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { COLORS } from '@/constants/colors';
import MainLayout from '@/components/layouts/main-layout';

const FEATURES = [
  'Detección automática de deducciones',
  'Extracción de datos con IA',
  'Organización inteligente de comprobantes',
];

export default function Welcome() {
  const router = useRouter();
  const { hasSeenOnboarding } = useOnboardingStore();

  const handleGetStarted = () => {
    router.push(hasSeenOnboarding ? '/(auth)/login' : '/(auth)/onboarding');
  };

  return (
    <MainLayout edges={['top', 'bottom']}>
      <ScrollView
        contentContainerClassName="px-6 py-8"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View
          entering={FadeInUp.delay(100)}
          className="mb-8 items-center"
        >
          <Image
            source={require('@/assets/konti_logo.png')}
            style={{ width: 160, height: 160 }}
            alt="Konti"
            contentFit="contain"
          />
        </Animated.View>

        {/* Headline */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          className="mb-6 items-center"
        >
          <Text className="mb-2 text-center text-4xl font-bold text-neutral-foreground">
            Gestiona tus boletas con
          </Text>
          <View className="flex-row items-center gap-2">
            <Text
              style={{ color: COLORS.primary.default }}
              className="text-4xl font-bold"
            >
              inteligencia
            </Text>
            <Text
              style={{ color: COLORS.secondary.default }}
              className="text-4xl font-bold"
            >
              artificial
            </Text>
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInUp.delay(300)} className="mb-8">
          <Text className="text-center text-base leading-relaxed text-neutral-muted">
            La app más inteligente para organizar tus comprobantes, detectar
            deducciones y simplificar tu declaración anual ante SUNAT.
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInUp.delay(400)} className="mb-8 gap-3">
          {FEATURES.map((feature) => (
            <View key={feature} className="flex-row items-center gap-3">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-primary-default/10">
                <Check
                  size={14}
                  color={COLORS.primary.default}
                  strokeWidth={3}
                />
              </View>
              <Text className="flex-1 text-base text-neutral-foreground">
                {feature}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInUp.delay(600)}>
          <TouchableOpacity
            onPress={handleGetStarted}
            className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary-default py-4 shadow-lg"
            activeOpacity={0.8}
          >
            <Text className="text-lg font-semibold text-neutral-white">
              Empecemos
            </Text>
            <ArrowRight size={18} color={COLORS.neutral.white} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </MainLayout>
  );
}
