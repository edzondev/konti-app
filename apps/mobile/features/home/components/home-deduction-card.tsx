import { Pressable, Text, View } from "react-native";

import { formatPen } from "@/features/tax-income/money";

import type { HomeDeductionProjection } from "../home-projection";

export function HomeDeductionCard({
	deductions,
	onReview,
}: {
	deductions: HomeDeductionProjection;
	onReview: () => void;
}) {
	return (
		<View className="rounded-[26px] border border-konti-ivory/10 bg-konti-surface p-5">
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-ivory/35">
				GASTOS QUE PUEDEN AYUDARTE
			</Text>
			<View className="mt-4 gap-4">
				<View className="rounded-2xl bg-konti-bg px-4 py-3">
					<Text className="text-[12px] text-konti-ivory/40">Incluido en tu estimación</Text>
					<Text className="mt-1 text-[22px] font-light text-konti-ivory">
						{formatPen(deductions.includedAmount)}
					</Text>
					<Text className="mt-1 text-[11px] leading-4 text-konti-ivory/35">
						{deductions.verificationLabel}
					</Text>
				</View>
				<View className="rounded-2xl border border-konti-primary/25 bg-konti-primary/8 px-4 py-3">
					<Text className="text-[12px] text-konti-primary/80">Podría ayudarte</Text>
					<Text className="mt-1 text-[22px] font-light text-konti-ivory">
						{formatPen(deductions.potentialAmount)}
					</Text>
					{deductions.unknownCount > 0 ? (
						<Text className="mt-1 text-[11px] leading-4 text-konti-ivory/40">
							{deductions.unknownCount}{" "}
							{deductions.unknownCount === 1 ? "gasto necesita" : "gastos necesitan"} revisión
						</Text>
					) : null}
				</View>
			</View>
			<Pressable
				accessibilityRole="button"
				className="mt-4 min-h-12 items-center justify-center"
				hitSlop={8}
				onPress={onReview}
				pressRetentionOffset={16}
			>
				<Text className="text-[13px] font-medium text-konti-primary">Revisar gastos</Text>
			</Pressable>
		</View>
	);
}
