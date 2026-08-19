import { Button, Text, View } from "react-native";

import { authClient } from "@/core/auth-client";
import { useUpdateCurrentTaxProfile } from "@/features/tax-profile/tax-profile.mutations";
import type { IncomeMode } from "@/features/tax-profile/types";

const incomeOptions: Array<{
	label: string;
	value: IncomeMode;
}> = [
	{
		label: "Trabajo para una empresa",
		value: "employment",
	},
	{
		label: "Trabajo por mi cuenta",
		value: "independent",
	},
	{
		label: "Ambos",
		value: "mixed",
	},
];

export default function OnboardingScreen() {
	const { data: session } = authClient.useSession();

	const userId = session?.user.id ?? "";

	const updateTaxProfile = useUpdateCurrentTaxProfile(userId);

	if (!session) {
		return null;
	}

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				gap: 20,
				padding: 24,
			}}
		>
			<View style={{ gap: 8 }}>
				<Text style={{ fontSize: 28 }}>¿Cómo obtienes tus ingresos?</Text>

				<Text>Esto permitirá que Konti entienda tu situación.</Text>
			</View>

			<View style={{ gap: 12 }}>
				{incomeOptions.map((option) => (
					<View key={option.value}>
						<Button
							disabled={updateTaxProfile.isPending}
							title={option.label}
							onPress={() => {
								updateTaxProfile.mutate({
									incomeMode: option.value,
									trackDeductibles: false,
								});
							}}
						/>
					</View>
				))}
			</View>

			{updateTaxProfile.isError ? (
				<Text>No se pudo guardar tu información. Inténtalo nuevamente.</Text>
			) : null}
		</View>
	);
}
