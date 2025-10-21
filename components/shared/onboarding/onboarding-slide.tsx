import { View, Text } from 'react-native';
import { OnboardingIllustration } from './onboarding-illustration';

interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: 'scan' | 'organize' | 'taxes';
}

export function OnboardingSlide({
  title,
  description,
  illustration,
}: OnboardingSlideProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* Illustration */}
      <View className="mb-16">
        <OnboardingIllustration type={illustration} />
      </View>

      {/* Content */}
      <View className="items-center gap-y-4">
        <Text className="text-center text-3xl font-bold leading-tight text-neutral-foreground">
          {title}
        </Text>

        <Text className="text-center text-base leading-relaxed text-muted-foreground">
          {description}
        </Text>
      </View>
    </View>
  );
}
