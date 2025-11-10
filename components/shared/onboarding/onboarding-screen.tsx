import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { OnboardingSlide } from './onboarding-slide';
import { PaginationDots } from './pagination-dots';
import { ONBOARDING_SLIDES } from '@/constants/onboarding';
import { useOnboarding } from '@/hooks/onboarding/use-onboarding';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const scrollRef = React.useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { completeOnboarding, skipOnboarding } = useOnboarding();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Skip button */}
      {!isLastSlide && (
        <View className="absolute right-6 top-14 z-10">
          <TouchableOpacity onPress={skipOnboarding} activeOpacity={0.7}>
            <Text className="text-base font-medium text-primary">Omitir</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Slides */}
      <AnimatedScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {ONBOARDING_SLIDES.map((item) => (
          <View key={item.id} style={{ width }}>
            <OnboardingSlide
              title={item.title}
              description={item.description}
              illustration={item.illustration as 'scan' | 'organize' | 'taxes'}
            />
          </View>
        ))}
      </AnimatedScrollView>

      {/* Bottom section with pagination and button */}
      <View className="px-8 pb-8">
        {/* Pagination dots */}
        <View className="mb-8 items-center">
          <PaginationDots
            total={ONBOARDING_SLIDES.length}
            scrollX={scrollX}
            width={width}
          />
        </View>

        {/* Action button */}
        {isLastSlide ? (
          <TouchableOpacity
            onPress={completeOnboarding}
            className="items-center justify-center rounded-2xl bg-primary py-5 shadow-lg"
            activeOpacity={0.8}
          >
            <Text className="text-lg font-semibold text-white">
              Comenzar con Konti
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            className="items-center justify-center rounded-2xl bg-primary py-5 shadow-lg"
            activeOpacity={0.8}
          >
            <Text className="text-lg font-semibold text-white">Siguiente</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
