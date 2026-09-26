import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
	...config,
	name: "app-konti",
	slug: "app-konti",
	version: "0.0.1",
	orientation: "portrait",
	icon: "./assets/images/icon.png",
	scheme: "appkonti",
	userInterfaceStyle: "automatic",
	ios: {
		supportsTablet: true,
		deploymentTarget: "16.4",
		infoPlist: {
			NSCameraUsageDescription: "Konti usa la cámara para guardar tus comprobantes.",
		},
	},
	android: {
		adaptiveIcon: {
			backgroundColor: "#F5F1EA",
			foregroundImage: "./assets/images/konti-adaptive-foreground.png",
			backgroundImage: "./assets/images/konti-adaptive-background.png",
			monochromeImage: "./assets/images/konti-icon-mono.png",
		},
		predictiveBackGestureEnabled: false,
		package: "com.konti.app",
		permissions: ["android.permission.CAMERA"],
		googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
	},
	web: {
		bundler: "metro",
		output: "static",
		favicon: "./assets/images/favicon.png",
	},
	plugins: [
		"@react-native-google-signin/google-signin",
		"expo-router",
		[
			"expo-font",
			{
				fonts: [
					"./assets/fonts/Geist-Light.otf",
					"./assets/fonts/Geist-Regular.otf",
					"./assets/fonts/Geist-Medium.otf",
					"./assets/fonts/Geist-SemiBold.otf",
					"./assets/fonts/GeistMono-Regular.otf",
					"./assets/fonts/GeistMono-Medium.otf",
				],
			},
		],
		[
			"expo-splash-screen",
			{
				image: "./assets/images/splash-icon.png",
				imageWidth: 200,
				resizeMode: "contain",
				backgroundColor: "#F5F1EA",
				dark: {
					image: "./assets/images/splash-icon-dark.png",
					backgroundColor: "#1A1814",
				},
			},
		],
		"expo-secure-store",
		[
			"expo-image-picker",
			{
				photosPermission: "Konti necesita acceso a tus fotos para guardar tus comprobantes.",
			},
		],
		"expo-build-properties",
		"expo-sharing",
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
	extra: {
		router: {},
		eas: {
			projectId: "2a4640e5-ff57-4106-b9d0-2623bfea9d16",
		},
	},
	owner: "edzondev",
	runtimeVersion: {
		policy: "appVersion",
	},
	updates: {
		url: "https://u.expo.dev/2a4640e5-ff57-4106-b9d0-2623bfea9d16",
	},
});
