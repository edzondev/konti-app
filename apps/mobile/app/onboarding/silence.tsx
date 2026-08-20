import { useRouter } from "expo-router";
import { Text } from "react-native";

import { OnboardingShell } from "@/features/onboarding/onboarding-shell";

export default function SilenceScreen() {
	const router = useRouter();

	return (
		<OnboardingShell
			title={
				<Text className="text-[40px] font-light leading-[46px] text-konti-ivory">
					Te escribimos <Text className="italic text-konti-primary">solo</Text> si hace falta.
				</Text>
			}
			body="El resto del tiempo, silencio."
			primaryLabel="Continuar"
			onPrimaryPress={() => router.push("/onboarding/income")}
		/>
	);
}
