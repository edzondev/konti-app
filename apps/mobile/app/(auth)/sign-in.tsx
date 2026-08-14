import { Text, View } from "react-native";

import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";

export default function SignInScreen() {
	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				gap: 24,
				padding: 24,
			}}
		>
			<View style={{ gap: 8 }}>
				<Text style={{ fontSize: 32 }}>Konti</Text>
				<Text>Tu situación tributaria, en orden.</Text>
			</View>

			<GoogleSignInButton />
		</View>
	);
}
