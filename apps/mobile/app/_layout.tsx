import { GoogleOneTapSignIn } from "@react-native-google-signin/google-signin";
import { Stack } from "expo-router";
//import * as SplashScreen from "expo-splash-screen";
import "../global.css";

import "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
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

// Prevent the splash screen from auto-hiding before asset loading is complete.
//SplashScreen.preventAutoHideAsync();

GoogleOneTapSignIn.configure({
	webClientId: "autoDetect",
});

export default function RootLayout() {
	return (
		<QueryProvider>
			<Layout />
		</QueryProvider>
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

	if (isSessionPending) {
		return <LoadingState message="Validando sesión..." />;
	}

	if (!session && sessionError) {
		return <LoadingState message="No se pudo validar la sesión." />;
	}

	if (session && taxProfileQuery.isPending) {
		return <LoadingState message="Preparando Konti..." />;
	}

	if (session && taxProfileQuery.isError) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					gap: 16,
					padding: 24,
				}}
			>
				<Text>No se pudo cargar tu perfil tributario.</Text>

				<Pressable
					onPress={() => {
						void taxProfileQuery.refetch();
					}}
				>
					<Text>Reintentar</Text>
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
			</Stack.Protected>
		</Stack>
	);
}

function LoadingState({ message }: { message: string }) {
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
				padding: 24,
			}}
		>
			<Text>{message}</Text>
		</View>
	);
}
