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
import { AuthProvider } from "@/components/providers/auth-provider";

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="success" />
      <Stack.Screen
        name="onboarding"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
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
