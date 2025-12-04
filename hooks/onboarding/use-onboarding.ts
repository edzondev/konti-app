import { useRouter } from 'expo-router';

import { useOnboardingStore } from '@/store/use-onboarding-store';

export function useOnboarding() {
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboardingStore();
  const router = useRouter();

  const checkOnboarding = () => {
    if (!hasSeenOnboarding) {
      router.replace('/(auth)/onboarding');
      return false;
    }
    return true;
  };

  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    router.push('/(auth)/login');
  };

  const skipOnboarding = () => {
    setHasSeenOnboarding(true);
    router.push('/(auth)/login');
  };

  const resetOnboarding = () => {
    setHasSeenOnboarding(false);
  };

  return {
    hasSeenOnboarding,
    checkOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}

