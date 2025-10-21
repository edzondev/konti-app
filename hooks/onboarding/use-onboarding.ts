import { useOnboardingStore } from '@/store/use-onboarding-store';
import { useRouter } from 'expo-router';

/**
 * Custom hook to manage onboarding flow
 * 
 * Usage:
 * - Call `checkOnboarding()` on app init to redirect if needed
 * - Call `completeOnboarding()` when user finishes onboarding
 */
export function useOnboarding() {
  const { hasSeenOnboarding, setHasSeenOnboarding } = useOnboardingStore();
  const router = useRouter();

  /**
   * Check if user has completed onboarding
   * If not, redirect to onboarding screen
   */
  const checkOnboarding = () => {
    if (!hasSeenOnboarding) {
      router.replace('/(auth)/onboarding');
      return false;
    }
    return true;
  };

  /**
   * Mark onboarding as completed and navigate to login
   */
  const completeOnboarding = () => {
    setHasSeenOnboarding(true);
    router.push('/(auth)/login');
  };

  /**
   * Skip onboarding and go directly to login
   */
  const skipOnboarding = () => {
    setHasSeenOnboarding(true);
    router.push('/(auth)/login');
  };

  /**
   * Reset onboarding state (useful for testing)
   */
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

