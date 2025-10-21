import { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { useOnboardingStore } from '@/store/use-onboarding-store';

export default function AuthLayout() {
  const { hasSeenOnboarding } = useOnboardingStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're at the root auth screen
    const isAuthIndex = pathname === '/' || pathname === '/(auth)';

    if (isAuthIndex && !hasSeenOnboarding) {
      router.replace('/(auth)/onboarding');
    }
  }, [hasSeenOnboarding, pathname, router]);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
    </Stack>
  );
}
