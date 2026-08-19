import { GoogleOneTapSignIn } from "@react-native-google-signin/google-signin";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "../global.css";

import "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { authClient } from "@/core/auth-client";
import { QueryProvider } from "@/core/query-provider";
import { currentTaxProfileQuery } from "@/features/tax-profile/tax-profile.queries";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

GoogleOneTapSignIn.configure({
	webClientId: "autoDetect",
});

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<QueryProvider>
				<Layout />
			</QueryProvider>
		</GestureHandlerRootView>
	);
}

function Layout() {
	const {
		data: session,
		isPending: isSessionPending,
		error: sessionError,
	} = authClient.useSession();

	const userId = session?.user.id ?? "";

	const taxProfileQuery = useQuery({
		...currentTaxProfileQuery(userId),
		enabled: Boolean(userId),
	});

	useEffect(() => {
		if (!isSessionPending && (!session || !taxProfileQuery.isPending)) {
			void SplashScreen.hideAsync();
		}
	}, [isSessionPending, session, taxProfileQuery.isPending]);

	if (isSessionPending) {
		return <View className="flex-1 bg-konti-bg" />;
	}

	if ((!session && sessionError) || (session && taxProfileQuery.isPending)) {
		return <View className="flex-1 bg-konti-bg" />;
	}

	if (session && taxProfileQuery.isError) {
		return (
			<View className="flex-1 items-center justify-center gap-4 bg-konti-bg p-6">
				<Text className="text-center text-base text-konti-ivory">
					No se pudo cargar tu perfil tributario.
				</Text>

				<Pressable
					className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
					onPress={() => {
						void taxProfileQuery.refetch();
					}}
				>
					<Text className="font-medium text-konti-bg">Reintentar</Text>
				</Pressable>
			</View>
		);
	}

	const requiresOnboarding = taxProfileQuery.data?.requiresOnboarding ?? true;

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={!session}>
				<Stack.Screen name="sign-in" />
			</Stack.Protected>

			<Stack.Protected guard={Boolean(session) && requiresOnboarding}>
				<Stack.Screen name="onboarding" />
			</Stack.Protected>

			<Stack.Protected guard={Boolean(session) && !requiresOnboarding}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="document/[id]" />
			</Stack.Protected>
		</Stack>
	);
}
