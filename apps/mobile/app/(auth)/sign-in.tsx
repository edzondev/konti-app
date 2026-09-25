import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { triggerHaptic } from "@/core/haptics";
import { GoogleSignInButton } from "@/features/auth/google-sign-in-button";
import { hasAcceptedTerms } from "@/features/auth/terms-acceptance";
import { PRIVACY_URL, TERMS_URL } from "@/features/profile/legal";
import { Check } from "@/shared/ui/reicon";

export default function SignInScreen() {
	const returning = hasAcceptedTerms();
	const [accepted, setAccepted] = useState(false);
	const insets = useSafeAreaInsets();

	function toggleAccepted() {
		void triggerHaptic("selection");
		setAccepted((checked) => !checked);
	}

	return (
		<View className="flex-1 bg-konti-bg px-7.5" style={{ paddingBottom: insets.bottom + 32 }}>
			<Text className="mt-8 font-normal text-[20px] tracking-tight text-konti-ink">
				kont<Text className="text-konti-amber">i</Text>
			</Text>
			<View className="flex-1" />
			<Text className="font-light text-[34px] leading-10 tracking-tight text-konti-ink">
				Tus comprobantes, <Text className="italic text-konti-amber">en orden</Text>.
			</Text>
			<Text className="mt-3.5 w-full text-[15.5px] leading-6 text-konti-ink-muted">
				Konti guarda y clasifica tus boletas. No calcula impuestos.
			</Text>
			<View className="mt-8 w-full">
				<GoogleSignInButton disabled={!returning && !accepted} />
			</View>
			{returning ? null : (
				<View className="mt-7 w-full flex-row flex-wrap items-center">
					<Pressable
						accessibilityLabel="Acepto los términos y la política de privacidad"
						accessibilityRole="checkbox"
						accessibilityState={{ checked: accepted }}
						className="flex-row items-center gap-3"
						hitSlop={8}
						onPress={toggleAccepted}
					>
						<View
							className={
								accepted
									? "size-[18px] items-center justify-center rounded-[4px] border border-konti-amber bg-konti-amber"
									: "size-[18px] items-center justify-center rounded-[4px] border border-konti-ink-muted"
							}
						>
							{accepted ? <Check colorClassName="accent-konti-bg" size={12} /> : null}
						</View>
						<Text className="text-[12.5px] leading-5 text-konti-ink-muted">Acepto los </Text>
					</Pressable>
					<Pressable
						accessibilityRole="link"
						onPress={() => {
							void Linking.openURL(TERMS_URL);
						}}
					>
						<Text className="text-[12.5px] leading-5 text-konti-ink">Términos</Text>
					</Pressable>
					<Pressable hitSlop={8} onPress={toggleAccepted}>
						<Text className="text-[12.5px] leading-5 text-konti-ink-muted"> y la </Text>
					</Pressable>
					<Pressable
						accessibilityRole="link"
						onPress={() => {
							void Linking.openURL(PRIVACY_URL);
						}}
					>
						<Text className="text-[12.5px] leading-5 text-konti-ink">Política de privacidad</Text>
					</Pressable>
				</View>
			)}
		</View>
	);
}
