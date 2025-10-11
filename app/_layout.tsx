import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import "./globals.css";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import QueryProvider from "@/components/providers/query-provider";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { usePurchasesMonitor } from "@/hooks/subscriptions/use-purchases-monitor";
import { usePurchasesInitialize } from "@/hooks/subscriptions/use-purchases-initialize";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

function Layout() {
  const [loaded] = useFonts({
    GeistBold: require("../assets/fonts/Geist-Bold.ttf"),
    GeistMedium: require("../assets/fonts/Geist-Medium.ttf"),
    GeistRegular: require("../assets/fonts/Geist-Regular.ttf"),
    GeistSemibold: require("../assets/fonts/Geist-SemiBold.ttf"),
  });
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, loading]);

  if (!loaded || loading) {
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
        <Stack.Screen name="preview" />
        <Stack.Screen name="success" />
        <Stack.Screen
          name="subscription"
          options={{
            presentation: "modal",
            headerShown: false,
            gestureEnabled: true,
            animationTypeForReplace: "push",
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const isMonitorInitialized = usePurchasesMonitor();
  const isInitialized = usePurchasesInitialize();

  console.log("isMonitorInitialized", isMonitorInitialized);
  console.log("isInitialized", isInitialized);
  return (
    <AuthProvider>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <QueryProvider>
          <Layout />
          <StatusBar style="dark" />
        </QueryProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
