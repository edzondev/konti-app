import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import {
	incomeChoicesToMode,
	type IncomeChoice,
} from "@/features/tax-profile/income-mode";

const incomeOptions: Array<{
	title: string;
	support: string;
	value: IncomeChoice;
}> = [
	{
		title: "En planilla",
		support: "Quinta categoría · tu empleador retiene",
		value: "planilla",
	},
	{
		title: "Recibos por honorarios",
		support: "Cuarta categoría · trabajas independiente",
		value: "honorarios",
	},
];

export default function IncomeScreen() {
	const router = useRouter();
	const { incomeChoices, toggleChoice } = useOnboarding();
	const canContinue = incomeChoicesToMode(incomeChoices) !== null;

	return (
		<OnboardingShell
			title={
				<Text className="text-[40px] font-light leading-[46px] text-konti-canvas-text">
					¿Cómo generas ingresos?
				</Text>
			}
			primaryLabel="Continuar"
			primaryDisabled={!canContinue}
			onPrimaryPress={() => router.push("/onboarding/deductibles")}
		>
			<View className="gap-3">
				{incomeOptions.map((option) => {
					const selected = incomeChoices.includes(option.value);

					return (
						<Pressable
							key={option.value}
							accessibilityRole="checkbox"
							accessibilityState={{ checked: selected }}
							className={`rounded-[18px] border bg-[#191715] p-5 ${
								selected ? "border-[#E2A654]" : "border-[#3A3732]"
							}`}
							onPress={() => toggleChoice(option.value)}
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
