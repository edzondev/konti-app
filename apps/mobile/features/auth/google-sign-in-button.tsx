import { GoogleOneTapSignIn, statusCodes } from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { authClient } from "@/core/auth-client";
import { triggerHaptic } from "@/core/haptics";
import { markTermsAccepted } from "@/features/auth/terms-acceptance";

const DEFAULT_ERROR_MESSAGE = "No se pudo entrar. Inténtalo de nuevo.";
const GOOGLE_LOGO = require("../../node_modules/@react-native-google-signin/google-signin/src/buttons/assets/logo.png");

function googleErrorMessage(error: unknown): string {
	const code =
		typeof error === "object" && error !== null && "code" in error
			? (error as { code?: unknown }).code
			: null;

	switch (code) {
		case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
			return "Google Play Services no está disponible.";

		case statusCodes.IN_PROGRESS:
			return "Ya existe un inicio de sesión en curso.";

		default:
			return DEFAULT_ERROR_MESSAGE;
	}
}

export function GoogleSignInButton({ disabled = false }: { disabled?: boolean }) {
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function handlePress() {
		if (disabled || isSigningIn) {
			return;
		}

		setIsSigningIn(true);
		setMessage(null);

		try {
			await GoogleOneTapSignIn.checkPlayServices(true);
			const response = await GoogleOneTapSignIn.presentExplicitSignIn();

			if (response.type === "cancelled") {
				return;
			}

			const user = response.data;

			if (!user?.idToken) {
				setMessage("Google no devolvió una credencial válida.");
				await triggerHaptic("error");
				return;
			}

			const { error: signInError } = await authClient.signIn.social({
				provider: "google",
				idToken: {
					token: user.idToken,
				},
			});

			if (signInError) {
				setMessage(signInError.message ?? "No se pudo crear la sesión de Konti.");
				await triggerHaptic("error");
				return;
			}

			markTermsAccepted();
			await triggerHaptic("success");
		} catch (error) {
			setMessage(googleErrorMessage(error));
			await triggerHaptic("error");
		} finally {
			setIsSigningIn(false);
		}
	}

	return (
		<View className="w-full gap-3">
			<Pressable
				accessibilityRole="button"
				className="h-[58px] w-full flex-row items-center justify-center gap-3 rounded-full bg-white disabled:opacity-50"
				disabled={disabled || isSigningIn}
				onPress={handlePress}
			>
				<Image
					accessibilityIgnoresInvertColors
					accessible={false}
					source={GOOGLE_LOGO}
					style={{ flexShrink: 0, height: 20, width: 20 }}
				/>
				<Text className="font-sans-medium text-base text-black" numberOfLines={1}>
					{isSigningIn ? "Iniciando sesión..." : "Continuar con Google"}
				</Text>
			</Pressable>

			{message ? <Text className="text-konti-ink-muted">{message}</Text> : null}
		</View>
	);
}
