import { useRouter } from "expo-router";
import { Text } from "react-native";

import { OnboardingShell } from "@/features/onboarding/onboarding-shell";

export default function SilenceScreen() {
	const router = useRouter();

	return (
		<OnboardingShell
			title={
				<Text className="text-[40px] font-light leading-[46px] text-konti-canvas-text">
					Te escribimos{" "}
					<Text
						className="text-konti-accent"
						style={{ fontFamily: "InstrumentSerif_400Regular_Italic" }}
					>
						solo
					</Text>{" "}
					si hace falta.
				</Text>
			}
			body="El resto del tiempo, silencio."
			primaryLabel="Continuar"
			onPrimaryPress={() => router.push("/onboarding/income")}
		/>
	);
}
