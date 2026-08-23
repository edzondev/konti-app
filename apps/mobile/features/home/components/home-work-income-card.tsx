import { Pressable, Text, View } from "react-native";

import { formatPen } from "@/features/tax-income/money";

import type { HomeWorkIncomeSummary } from "../types";

export function HomeWorkIncomeCard({
	workIncome,
	annualDifference,
	onReview,
}: {
	workIncome: HomeWorkIncomeSummary;
	annualDifference: string | null;
	onReview: () => void;
}) {
	return (
		<Pressable
			accessibilityHint="Abre el detalle de la estimación anual"
			accessibilityRole="button"
			className="rounded-[26px] border border-konti-ivory/10 bg-konti-surface p-5"
			onPress={onReview}
			pressRetentionOffset={16}
		>
			<View className="flex-row items-center justify-between gap-4">
				<Text className="font-mono text-[10px] tracking-[2px] text-konti-ivory/35">
					INGRESOS 2026
				</Text>
				<Text className="text-[13px] text-konti-primary">Ver estimación</Text>
			</View>
			<View className="mt-4 gap-3">
				{workIncome.fourthGrossAmount !== null ? (
					<AmountRow label="Honorarios registrados" value={workIncome.fourthGrossAmount} />
				) : null}
				{workIncome.employmentGrossAmount !== null ? (
					<AmountRow label="Planilla registrada" value={workIncome.employmentGrossAmount} />
				) : null}
			</View>
			{annualDifference !== null ? (
				<View className="mt-4 border-t border-konti-ivory/10 pt-4">
					<Text className="text-[12px] text-konti-ivory/40">
						Diferencia anual estimada con créditos registrados
					</Text>
					<Text className="mt-1 text-[18px] text-konti-ivory">{formatPen(annualDifference)}</Text>
				</View>
			) : null}
		</Pressable>
	);
}

function AmountRow({ label, value }: { label: string; value: string }) {
	return (
		<View className="flex-row items-baseline justify-between gap-4">
			<Text className="flex-1 text-[13px] text-konti-ivory/45">{label}</Text>
			<Text className="text-[18px] font-light text-konti-ivory">{formatPen(value)}</Text>
		</View>
	);
}
