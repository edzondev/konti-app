import { Pressable, Text, View } from "react-native";

import type { HomeAttentionProjection } from "../home-projection";

export function HomeAttentionCard({
	attention,
	onPress,
}: {
	attention: HomeAttentionProjection;
	onPress: () => void;
}) {
	return (
		<View className="rounded-[26px] border border-konti-primary/35 bg-konti-primary/10 p-5">
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
				{attentionKindLabel(attention.itemType)}
			</Text>
			<Text className="mt-3 text-[22px] font-light leading-7 text-konti-ivory">
				{attention.title}
			</Text>
			<Text className="mt-2 text-[14px] leading-6 text-konti-ivory/50">
				{attention.description}
			</Text>
			<Pressable
				accessibilityHint="Abre el paso necesario para resolver esta revisión"
				accessibilityRole="button"
				className="mt-5 min-h-13 items-center justify-center rounded-[17px] bg-konti-ivory px-5"
				hitSlop={8}
				onPress={onPress}
				pressRetentionOffset={16}
			>
				<Text className="text-[14px] font-semibold text-konti-bg">{attention.actionLabel}</Text>
			</Pressable>
		</View>
	);
}

function attentionKindLabel(itemType: HomeAttentionProjection["itemType"]): string {
	switch (itemType) {
		case "confirm_rhe_payment":
			return "RECIBO POR HONORARIOS";
		case "classify_fourth_activity":
			return "TIPO DE ACTIVIDAD";
		case "resolve_employment_coverage":
			return "PLANILLA";
		case "verify_deduction":
			return "GASTO DEDUCIBLE";
		case "review_monthly_fourth":
			return "CUARTA MENSUAL";
	}
}
