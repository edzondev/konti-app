import {
	GoogleLogoButton,
	GoogleOneTapSignIn,
	statusCodes,
} from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Text, View } from "react-native";
import { useUniwind } from "uniwind";

import { authClient } from "@/core/auth-client";

const DEFAULT_ERROR_MESSAGE = "No se pudo entrar. Inténtalo de nuevo.";

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
			const { user, error, isCancelled } = await GoogleOneTapSignIn.authenticate();

			if (isCancelled) {
				return;
			}

			if (error) {
				switch (error.code) {
					case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
						setMessage("Google Play Services no está disponible.");
						break;

					case statusCodes.IN_PROGRESS:
						setMessage("Ya existe un inicio de sesión en curso.");
						break;

					default:
						setMessage(DEFAULT_ERROR_MESSAGE);
				}

				return;
			}

			if (!user?.idToken) {
				setMessage("Google no devolvió una credencial válida.");
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
			}
		} catch {
			setMessage(DEFAULT_ERROR_MESSAGE);
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
