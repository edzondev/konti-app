import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";

const deductibleOptions = [
	{
		title: "Sí, quiero recuperarlos",
		support:
			"Restaurantes, alquiler y servicios profesionales. Puedes deducir hasta 3 UIT.",
		value: true,
	},
	{
		title: "Ahora no",
		support: "Puedes activarlo cuando quieras.",
		value: false,
	},
] as const;

export default function DeductiblesScreen() {
	const router = useRouter();
	const { trackDeductibles, setTrackDeductibles } = useOnboarding();

	return (
		<OnboardingShell
			title={
				<Text className="text-[40px] font-light leading-[46px] text-konti-canvas-text">
					¿Seguimos tus gastos deducibles?
				</Text>
			}
			primaryLabel="Continuar"
			primaryDisabled={trackDeductibles === null}
			onPrimaryPress={() => router.push("/onboarding/ready")}
		>
			<View className="gap-3">
				{deductibleOptions.map((option) => {
					const selected = trackDeductibles === option.value;

					return (
						<Pressable
							key={option.title}
							accessibilityRole="radio"
							accessibilityState={{ checked: selected }}
							className={`rounded-[18px] border bg-[#191715] p-5 ${
								selected ? "border-[#E2A654]" : "border-[#3A3732]"
							}`}
							onPress={() => setTrackDeductibles(option.value)}
						>
							<View className="gap-1">
								<Text className="text-lg font-medium text-konti-canvas-text">{option.title}</Text>
								<Text className="text-sm leading-5 text-konti-canvas-muted">{option.support}</Text>
							</View>
						</Pressable>
					);
				})}
			</View>
		</OnboardingShell>
	);
}
