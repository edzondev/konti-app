import "react-native-reanimated";
import "@/core/sentry";
import "../global.css";

import { GoogleOneTapSignIn } from "@react-native-google-signin/google-signin";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { usePostHog } from "posthog-react-native";
import { useEffect } from "react";
import { useUniwind } from "uniwind";

import { AppProviders } from "@/core/app-providers";
import { authClient } from "@/core/auth-client";
import { syncPostHogUser } from "@/core/posthog-identity";
import { endAccountDeletion, markTermsAccepted } from "@/features/auth/terms-acceptance";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

SplashScreen.setOptions({
	fade: true,
	duration: 1000,
});

void SplashScreen.preventAutoHideAsync();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
if (!googleWebClientId) {
	throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined");
}

GoogleOneTapSignIn.configure({
	webClientId: googleWebClientId,
});

function RootLayout() {
	const { theme } = useUniwind();

	return (
		<AppProviders>
			<StatusBar style={theme === "dark" ? "light" : "dark"} />
			<RootNavigator />
		</AppProviders>
	);
}

function RootNavigator() {
	const posthog = usePostHog();
	const { data: session, isPending } = authClient.useSession();

	useEffect(() => {
		if (isPending) return;
		void SplashScreen.hideAsync();
	}, [isPending]);

	useEffect(() => {
		if (isPending) return;
		syncPostHogUser(posthog, session?.user.id ?? null);
	}, [isPending, posthog, session?.user.id]);

	useEffect(() => {
		if (session) markTermsAccepted();
		else endAccountDeletion();
	}, [session]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={!session}>
				<Stack.Screen name="(auth)/sign-in" />
			</Stack.Protected>

			<Stack.Protected guard={Boolean(session)}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="deducciones/[year]" />
				<Stack.Screen name="privacidad" />
				<Stack.Screen name="sesiones" />
			</Stack.Protected>
		</Stack>
	);
}

export default Sentry.wrap(RootLayout);
