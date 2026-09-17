import "react-native-reanimated";
import "../global.css";

import { GoogleOneTapSignIn } from "@react-native-google-signin/google-signin";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { AppProviders } from "@/core/app-providers";
import { authClient } from "@/core/auth-client";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

void SplashScreen.preventAutoHideAsync();

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
if (!googleWebClientId) {
	throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined");
}

GoogleOneTapSignIn.configure({
	webClientId: googleWebClientId,
});

export default function RootLayout() {
	return (
		<AppProviders>
			<RootNavigator />
		</AppProviders>
	);
}

function RootNavigator() {
	const { data: session } = authClient.useSession();

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={!session}>
				<Stack.Screen name="(auth)/sign-in" />
			</Stack.Protected>

			<Stack.Protected guard={Boolean(session)}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen
					name="comprobante/[id]"
					options={{
						presentation: "formSheet",
						headerShown: false,
						sheetGrabberVisible: true,
						sheetAllowedDetents: "fitToContents",
						sheetCornerRadius: 28,
						sheetShouldOverflowTopInset: false,
						sheetExpandsWhenScrolledToEdge: false,
						animation: "slide_from_bottom",
						animationDuration: 350,
						contentStyle: { backgroundColor: "#fff" },
					}}
				/>
			</Stack.Protected>
		</Stack>
	);
}
