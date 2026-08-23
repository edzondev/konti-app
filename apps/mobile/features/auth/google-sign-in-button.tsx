import {
	GoogleLogoButton,
	GoogleOneTapSignIn,
	statusCodes,
} from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Text, View } from "react-native";
import { useUniwind } from "uniwind";

import { authClient } from "@/core/auth-client";
import { triggerHaptic } from "@/core/haptics";

const DEFAULT_ERROR_MESSAGE = "No se pudo entrar. Inténtalo de nuevo.";

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

export function GoogleSignInButton() {
	const { theme } = useUniwind();
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function handlePress() {
		if (isSigningIn) {
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
			<GoogleLogoButton
				disabled={isSigningIn}
				label={isSigningIn ? "Iniciando sesión..." : "Continuar con Google"}
				onPress={handlePress}
				shape="circular"
				style={{ height: 58, width: "100%" }}
				theme={theme === "dark" ? "light" : "dark"}
			/>

			{message ? <Text className="text-konti-ivory/50">{message}</Text> : null}
		</View>
	);
}
