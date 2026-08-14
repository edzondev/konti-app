import {
	GoogleLogoButton,
	GoogleOneTapSignIn,
	statusCodes,
} from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { authClient } from "@/core/auth-client";

function getAuthCookies() {
	const cookies = authClient.getCookie();

	if (!cookies) {
		throw new Error("No existe una sesión local");
	}

	return cookies;
}

export default function SessionTestScreen() {
	const { data: session, isPending, error } = authClient.useSession();
	const [protectedResult, setProtectedResult] = useState<string | null>(null);
	const [taxProfileResult, setTaxProfileResult] = useState<string | null>(null);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [isTaxBusy, setIsTaxBusy] = useState(false);
	const [signInMessage, setSignInMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!session) {
			return;
		}

		let cancelled = false;

		async function testProtectedEndpoints() {
			try {
				const cookies = getAuthCookies();

				const meResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/me`, {
					headers: {
						Cookie: cookies,
					},
					credentials: "omit",
				});

				if (!meResponse.ok) {
					throw new Error(`Error HTTP ${meResponse.status} en /v1/me`);
				}

				const user = await meResponse.json();
				console.log(user);

				const taxResponse = await fetch(
					`${process.env.EXPO_PUBLIC_API_URL}/v1/tax-profile/current`,
					{
						headers: {
							Cookie: cookies,
						},
						credentials: "omit",
					},
				);

				if (!taxResponse.ok) {
					throw new Error(`Error HTTP ${taxResponse.status} en /v1/tax-profile/current`);
				}

				const taxProfile = await taxResponse.json();
				console.log(taxProfile);

				if (!cancelled) {
					setProtectedResult(JSON.stringify(user));
					setTaxProfileResult(JSON.stringify(taxProfile));
				}
			} catch (err) {
				console.error(err);

				if (!cancelled) {
					const message = err instanceof Error ? err.message : "Error desconocido";
					setProtectedResult(message);
					setTaxProfileResult(message);
				}
			}
		}

		void testProtectedEndpoints();

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

	async function handleGetTaxProfile() {
		if (isTaxBusy) {
			return;
		}

		setIsTaxBusy(true);

		try {
			const cookies = getAuthCookies();
			const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/tax-profile/current`, {
				headers: {
					Cookie: cookies,
				},
				credentials: "omit",
			});

			const body = await response.json();
			console.log(body);

			if (!response.ok) {
				throw new Error(`Error HTTP ${response.status}`);
			}

			setTaxProfileResult(JSON.stringify(body));
		} catch (err) {
			console.error(err);
			setTaxProfileResult(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setIsTaxBusy(false);
		}
	}

	async function handleCreateTaxProfile() {
		if (isTaxBusy) {
			return;
		}

		setIsTaxBusy(true);

		try {
			const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/v1/tax-profile/current`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Cookie: getAuthCookies(),
				},
				credentials: "omit",
				body: JSON.stringify({
					incomeMode: "employment",
				}),
			});

			const body = await response.json();
			console.log(body);

			if (!response.ok) {
				throw new Error(`Error HTTP ${response.status}`);
			}

			setTaxProfileResult(JSON.stringify(body));
		} catch (err) {
			console.error(err);
			setTaxProfileResult(err instanceof Error ? err.message : "Error desconocido");
		} finally {
			setIsTaxBusy(false);
		}
	}

	async function handleSignOut() {
		await authClient.signOut();
		setTaxProfileResult(null);

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

			<Text>Tax profile</Text>
			<Text>{taxProfileResult ?? "Probando /v1/tax-profile/current..."}</Text>
			<Button disabled={isTaxBusy} title="GET tax-profile/current" onPress={handleGetTaxProfile} />
			<Button disabled={isTaxBusy} title="PUT crear employment" onPress={handleCreateTaxProfile} />

			<Button title="Cerrar sesión" onPress={handleSignOut} />
		</View>
	);
}
