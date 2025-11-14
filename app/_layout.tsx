import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import './globals.css';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import QueryProvider from '@/components/providers/query-provider';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/components/providers/auth-provider';
import { usePurchasesMonitor } from '@/hooks/subscriptions/use-purchases-monitor';
import { usePurchasesInitialize } from '@/hooks/subscriptions/use-purchases-initialize';
import { useAppStateRefresh } from '@/hooks/use-app-state-refresh';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

function Layout() {
  usePurchasesMonitor();
  usePurchasesInitialize();
  useAppStateRefresh();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera" />
        <Stack.Screen
          name="photo-preview"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="preview" />
        <Stack.Screen name="success" />
        <Stack.Screen
          name="subscription"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true,
            animationTypeForReplace: 'push',
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryProvider>
          <AuthProvider>
            <Layout />
            <StatusBar style="dark" />
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
