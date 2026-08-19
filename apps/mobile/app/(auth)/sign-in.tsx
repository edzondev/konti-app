import { Text, View } from "react-native";

import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";

export default function SignInScreen() {
	return (
		<View className="flex-1 bg-konti-canvas px-[30px] pb-8">
			<Text className="mt-8 font-normal text-[20px] tracking-tight text-konti-canvas-text">
				kont<Text className="text-konti-accent">i</Text>
			</Text>
			<View className="flex-1" />
			<Text className="font-light text-[34px] leading-[40px] tracking-tight text-konti-canvas-text">
				Tu situación tributaria,{" "}
				<Text
					className="font-normal text-konti-accent"
					style={{ fontFamily: "InstrumentSerif_400Regular_Italic" }}
				>
					al día
				</Text>
				.
			</Text>
			<Text className="mt-3.5 max-w-[270px] text-[15.5px] leading-6 text-konti-canvas-muted">
				Konti ordena tus comprobantes y tus rentas por ti. Tú decides cuándo mirar.
			</Text>
			<View className="mt-8">
				<GoogleSignInButton />
			</View>
			<Text className="mt-7 text-[12.5px] text-konti-canvas-muted">Términos · Privacidad</Text>
		</View>
	);
}
