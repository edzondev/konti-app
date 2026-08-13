import {
	GoogleLogoButton,
	GoogleOneTapSignIn,
	statusCodes,
} from "@react-native-google-signin/google-signin";
import { useState } from "react";
import { Text, View } from "react-native";
import { authClient } from "@/lib/auth-client";

export default function TabOneScreen() {
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function handleGoogleSignIn() {
		if (isSigningIn) {
			return;
		}

		setIsSigningIn(true);
		setMessage(null);

		try {
			const { user, error, isCancelled } = await GoogleOneTapSignIn.authenticate();

			if (isCancelled) {
				setMessage("Inicio de sesión cancelado.");
				return;
			}

			if (error) {
				switch (error.code) {
					case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
						setMessage("Google Play Services no está disponible o necesita actualizarse.");
						break;

					case statusCodes.IN_PROGRESS:
						setMessage("Ya hay un inicio de sesión en curso.");
						break;

					default:
						setMessage(`No se pudo iniciar sesión: ${error.code}`);
				}

				return;
			}

			if (!user?.idToken) {
				setMessage("Google no devolvió un ID token.");
				return;
			}

			// Solo verificamos presencia. No imprimas el token.
			setMessage(
				`Google Sign-In funciona correctamente para ${user.user.email ?? "la cuenta seleccionada"}.`,
			);

			const { data, error: signInError } = await authClient.signIn.social({
				provider: "google",
				idToken: { token: user.idToken },
			});

			if (signInError) {
				setMessage(signInError.message ?? "Better Auth rechazó el inicio de sesión.");
				return;
			}

			setMessage(`Sesión creada para ${data?.user.email ?? "el usuario"}.`);
		} catch {
			setMessage("Ocurrió un error inesperado al iniciar sesión.");
		} finally {
			setIsSigningIn(false);
		}
	}

	return (
		<View>
			<GoogleLogoButton
				disabled={isSigningIn}
				label="Continuar con Google"
				onPress={handleGoogleSignIn}
				shape="rectangular"
				theme="neutral"
				variant="standard"
			/>

			{message ? <Text>{message}</Text> : null}
		</View>
	);
}
