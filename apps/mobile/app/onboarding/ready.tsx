import { useState } from "react";
import { Text, View } from "react-native";

import { useOnboarding } from "@/features/onboarding/onboarding-context";
import { OnboardingShell } from "@/features/onboarding/onboarding-shell";
import { incomeChoicesToMode } from "@/features/tax-profile/income-mode";
import { useTaxProfileOnboarding } from "@/features/tax-profile/use-tax-profile-onboarding";

export default function ReadyScreen() {
	const { incomeChoices, trackDeductibles } = useOnboarding();
	const { completeProfile, isSaving } = useTaxProfileOnboarding();
	const [saveFailed, setSaveFailed] = useState(false);
	const incomeMode = incomeChoicesToMode(incomeChoices);

	const incomeSummary =
		incomeMode === "mixed"
			? "Ingresos: planilla y honorarios"
			: incomeMode === "employment"
				? "Ingresos: planilla"
				: incomeMode === "independent"
					? "Ingresos: honorarios"
					: "Ingresos: por definir";

	async function handleComplete() {
		if (!incomeMode || trackDeductibles === null) {
			return;
		}

		setSaveFailed(false);

		try {
			await completeProfile({ incomeMode, trackDeductibles });
		} catch {
			setSaveFailed(true);
		}
	}

	return (
		<OnboardingShell
			title={
				<View className="gap-4">
					<View className="self-start rounded-full bg-[#2B251D] px-4 py-2">
						<Text className="text-xs font-medium text-konti-accent">Todo listo</Text>
					</View>

					<Text className="text-[40px] font-light leading-[46px] text-konti-canvas-text">
						Konti ya sabe{" "}
						<Text
							className="text-konti-accent"
							style={{ fontFamily: "InstrumentSerif_400Regular_Italic" }}
						>
							cómo trabajas
						</Text>
						.
					</Text>
				</View>
			}
			body="No necesitas hacer nada más hoy."
			primaryLabel="Entrar a Konti"
			primaryDisabled={isSaving || !incomeMode || trackDeductibles === null}
			onPrimaryPress={handleComplete}
		>
			<View className="gap-3 rounded-[18px] bg-[#191715] p-5">
				<Text className="text-base leading-6 text-konti-canvas-text">• {incomeSummary}</Text>
				<Text className="text-base leading-6 text-konti-canvas-text">
					• Deducibles:{" "}
					{trackDeductibles
						? "los seguimos"
						: "no los seguimos por ahora"}
				</Text>
			</View>

			{saveFailed ? (
				<Text selectable className="text-sm leading-5 text-konti-accent">
					No se pudo guardar tu información. Inténtalo nuevamente.
				</Text>
			) : null}
		</OnboardingShell>
	);
}
