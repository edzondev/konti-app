import "react-native-reanimated";
import "../global.css";

import {
	GoogleOneTapSignIn,
} from "@react-native-google-signin/google-signin";
import * as SplashScreen from "expo-splash-screen";

import { AppNavigator } from "@/core/app-navigator";
import { AppProviders } from "@/core/app-providers";

export {
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	initialRouteName: "(tabs)",
};

void SplashScreen.preventAutoHideAsync();

GoogleOneTapSignIn.configure({
	webClientId: "autoDetect",
});

export default function RootLayout() {
	return (
		<AppProviders>
			<AppNavigator />
		</AppProviders>
	);
}
