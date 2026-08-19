import { useRouter } from "expo-router";
import { Text } from "react-native";

import { OnboardingShell } from "@/features/onboarding/onboarding-shell";

export default function OnboardingScreen() {
	const router = useRouter();

	return (
		<OnboardingShell
			title={
				<Text className="text-[40px] font-light leading-[46px] text-konti-ivory">
					Nosotros nos{" "}
					<Text className="italic text-konti-primary">encargamos</Text>
					.
				</Text>
			}
			body="Tú solo guarda tus comprobantes."
			primaryLabel="Continuar"
			onPrimaryPress={() => router.push("/onboarding/silence")}
		/>
	);
}
