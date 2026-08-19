import { Text, View } from "react-native";

import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";

export default function SignInScreen() {
	return (
		<View className="flex-1 bg-konti-bg px-7.5 pb-8">
			<Text className="mt-8 font-normal text-[20px] tracking-tight text-konti-ivory">
				kont<Text className="text-konti-primary">i</Text>
			</Text>
			<View className="flex-1" />
			<Text className="font-light text-[34px] leading-10 tracking-tight text-konti-ivory">
				Tu situación tributaria, <Text className="italic text-konti-primary">al día</Text>.
			</Text>
			<Text className="mt-3.5 w-full text-[15.5px] leading-6 text-konti-ivory/50">
				Konti ordena tus comprobantes y tus rentas por ti. Tú decides cuándo mirar.
			</Text>
			<View className="mt-8 w-full">
				<GoogleSignInButton />
			</View>
			<Text className="mt-7 text-[12.5px] text-konti-ivory/50">Términos · Privacidad</Text>
		</View>
	);
}
