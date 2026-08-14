import {
	GoogleLogoButton,
	GoogleOneTapSignIn,
	statusCodes,
} from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Text, View } from "react-native";

import { authClient } from "@/core/auth-client";

export function GoogleSignInButton() {
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
						setMessage("No se pudo iniciar sesión con Google.");
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
			setMessage("Ocurrió un error inesperado.");
		} finally {
			setIsSigningIn(false);
		}
	}

	return (
		<View style={{ gap: 12 }}>
			<GoogleLogoButton
				disabled={isSigningIn}
				label={isSigningIn ? "Iniciando sesión..." : "Continuar con Google"}
				onPress={handlePress}
				shape="rectangular"
				theme="neutral"
				variant="standard"
			/>

			{message ? <Text>{message}</Text> : null}
		</View>
	);
}
