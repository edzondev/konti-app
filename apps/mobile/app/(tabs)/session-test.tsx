import {
	GoogleLogoButton,
	GoogleOneTapSignIn,
	statusCodes,
} from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { authClient } from "@/lib/auth-client";

export default function SessionTestScreen() {
	const { data: session, isPending, error } = authClient.useSession();
	const [protectedResult, setProtectedResult] = useState<string | null>(null);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [signInMessage, setSignInMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!session) {
			return;
		}

		let cancelled = false;

		async function testProtectedEndpoint() {
			try {
				const cookies = authClient.getCookie();

				if (!cookies) {
					throw new Error("No existe una sesión local");
				}

				const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/me`, {
					headers: {
						Cookie: cookies,
					},
					credentials: "omit",
				});

				if (!response.ok) {
					throw new Error(`Error HTTP ${response.status}`);
				}

				const user = await response.json();
				console.log(user);

				if (!cancelled) {
					setProtectedResult(JSON.stringify(user));
				}
			} catch (err) {
				console.error(err);

				if (!cancelled) {
					setProtectedResult(err instanceof Error ? err.message : "Error desconocido");
				}
			}
		}

		void testProtectedEndpoint();

		return () => {
			cancelled = true;
		};
	}, [session]);

	async function handleGoogleSignIn() {
		if (isSigningIn) {
			return;
		}

		setIsSigningIn(true);
		setSignInMessage(null);

		try {
			const { user, error: googleError, isCancelled } = await GoogleOneTapSignIn.authenticate();

			if (isCancelled) {
				setSignInMessage("Inicio de sesión cancelado.");
				return;
			}

			if (googleError) {
				switch (googleError.code) {
					case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
						setSignInMessage("Google Play Services no está disponible o necesita actualizarse.");
						break;
					case statusCodes.IN_PROGRESS:
						setSignInMessage("Ya hay un inicio de sesión en curso.");
						break;
					default:
						setSignInMessage(`No se pudo iniciar sesión: ${googleError.code}`);
				}
				return;
			}

			if (!user?.idToken) {
				setSignInMessage("Google no devolvió un ID token.");
				return;
			}

			const { error: signInError } = await authClient.signIn.social({
				provider: "google",
				idToken: { token: user.idToken },
			});

			if (signInError) {
				setSignInMessage(signInError.message ?? "Better Auth rechazó el inicio de sesión.");
			}
		} catch (err) {
			console.error(err);
			setSignInMessage("Ocurrió un error inesperado al iniciar sesión.");
		} finally {
			setIsSigningIn(false);
		}
	}

	async function handleSignOut() {
		await authClient.signOut();

		try {
			const cookies = authClient.getCookie();
			const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/me`, {
				headers: cookies ? { Cookie: cookies } : undefined,
				credentials: "omit",
			});

			if (response.status === 401) {
				setSignInMessage("OK: GET /v1/me respondió 401 Unauthorized tras cerrar sesión.");
				return;
			}

			setSignInMessage(`Fallo: GET /v1/me respondió ${response.status} (se esperaba 401).`);
		} catch (err) {
			console.error(err);
			setSignInMessage("Fallo: no se pudo llamar a GET /v1/me tras cerrar sesión.");
		}
	}

	if (isPending) {
		return <Text>Validando sesión...</Text>;
	}

	if (error) {
		return (
			<View>
				<Text>No se pudo recuperar la sesión.</Text>
				{signInMessage ? <Text>{signInMessage}</Text> : null}
				<GoogleLogoButton
					disabled={isSigningIn}
					label="Reintentar inicio de sesión"
					onPress={handleGoogleSignIn}
					shape="rectangular"
					theme="neutral"
					variant="standard"
				/>
			</View>
		);
	}

	if (!session) {
		return (
			<View>
				<Text>No hay una sesión activa.</Text>
				{signInMessage ? <Text>{signInMessage}</Text> : null}
				<GoogleLogoButton
					disabled={isSigningIn}
					label="Reintentar inicio de sesión"
					onPress={handleGoogleSignIn}
					shape="rectangular"
					theme="neutral"
					variant="standard"
				/>
			</View>
		);
	}

	return (
		<View>
			<Text>Sesión activa</Text>
			<Text>{session.user.name}</Text>
			<Text>{session.user.email}</Text>
			<Text>{protectedResult ?? "Probando /v1/me..."}</Text>

			<Button title="Cerrar sesión" onPress={handleSignOut} />
		</View>
	);
}
