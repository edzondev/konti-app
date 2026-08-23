import { useQuery } from "@tanstack/react-query";
import { type NativeStackNavigationOptions, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { currentTaxProfileQuery } from "@/features/tax-profile/tax-profile.queries";

import { type TaxFeatureAccess, taxFeatureAccess } from "./app-access";
import { authClient } from "./auth-client";

type AppAccessState =
	| { status: "loading" }
	| { status: "error"; retry: () => void }
	| { status: "signed-out" }
	| { status: "onboarding" }
	| { status: "ready"; features: TaxFeatureAccess };

const taxIncomeFormOptions: NativeStackNavigationOptions =
	process.env.EXPO_OS === "android"
		? {
				presentation: "modal",
				headerShown: false,
			}
		: {
				presentation: "formSheet",
				gestureEnabled: false,
				sheetAllowedDetents: [0.9, 1],
				sheetExpandsWhenScrolledToEdge: false,
				sheetGrabberVisible: true,
				headerShown: false,
			};

export function AppNavigator() {
	const access = useAppAccess();
	const splashWasHidden = useRef(false);

	useEffect(() => {
		if (access.status === "loading" || splashWasHidden.current) return;
		splashWasHidden.current = true;
		SplashScreen.hide();
	}, [access.status]);

	if (access.status === "loading") return splashWasHidden.current ? <AppLoading /> : null;
	if (access.status === "error") return <AppStartupError onRetry={access.retry} />;

	const isSignedOut = access.status === "signed-out";
	const requiresOnboarding = access.status === "onboarding";
	const isReady = access.status === "ready";
	const workIncomeEnabled = isReady && access.features.workIncome;
	const monthlyFourthEnabled = isReady && access.features.monthlyFourth;
	const deductionsEnabled = isReady && access.features.deductions;

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={isSignedOut}>
				<Stack.Screen name="(auth)/sign-in" />
			</Stack.Protected>

			<Stack.Protected guard={requiresOnboarding}>
				<Stack.Screen name="onboarding" />
			</Stack.Protected>

			<Stack.Protected guard={isReady}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="document/[id]" />
			</Stack.Protected>

			<Stack.Protected guard={workIncomeEnabled}>
				<Stack.Screen name="tax-income" />
				<Stack.Screen name="tax-status" />
				<Stack.Screen name="tax-income-form" options={taxIncomeFormOptions} />
			</Stack.Protected>

			<Stack.Protected guard={monthlyFourthEnabled}>
				<Stack.Screen name="monthly-fourth/[period]" />
			</Stack.Protected>

			<Stack.Protected guard={deductionsEnabled}>
				<Stack.Screen name="tax-deduction-form" options={taxIncomeFormOptions} />
			</Stack.Protected>
		</Stack>
	);
}

function useAppAccess(): AppAccessState {
	const sessionQuery = authClient.useSession();
	const session = sessionQuery.data;
	const userId = session?.user.id ?? "";
	const taxProfileQuery = useQuery({
		...currentTaxProfileQuery(userId),
		enabled: Boolean(userId),
	});

	if (sessionQuery.isPending) return { status: "loading" };
	if (!session) {
		if (sessionQuery.error) {
			return { status: "error", retry: () => void sessionQuery.refetch() };
		}
		return { status: "signed-out" };
	}
	if (taxProfileQuery.isPending) return { status: "loading" };
	if (taxProfileQuery.isError || !taxProfileQuery.data) {
		return { status: "error", retry: () => void taxProfileQuery.refetch() };
	}
	if (taxProfileQuery.data.requiresOnboarding) return { status: "onboarding" };

	return {
		status: "ready",
		features: taxFeatureAccess({
			incomeMode: taxProfileQuery.data.profile?.incomeMode ?? "independent",
			trackDeductibles: taxProfileQuery.data.profile?.trackDeductibles ?? false,
		}),
	};
}

function AppLoading() {
	return (
		<View className="flex-1 items-center justify-center bg-konti-bg">
			<ActivityIndicator />
		</View>
	);
}

function AppStartupError({ onRetry }: { onRetry: () => void }) {
	return (
		<View className="flex-1 items-center justify-center gap-4 bg-konti-bg px-6">
			<Text className="text-center text-base text-konti-ivory">No pudimos preparar Konti.</Text>
			<Pressable
				className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
				onPress={onRetry}
			>
				<Text className="font-medium text-konti-bg">Reintentar</Text>
			</Pressable>
		</View>
	);
}
