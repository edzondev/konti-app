import { Pressable, Text, View } from "react-native";

import type { HomeCoverageProjection } from "../home-projection";

export function HomeCoverageCard({
	coverage,
	monthlyOutstandingCount,
	onReview,
}: {
	coverage: HomeCoverageProjection;
	monthlyOutstandingCount: number;
	onReview: () => void;
}) {
	return (
		<View className="rounded-[26px] border border-konti-ivory/10 bg-konti-surface p-5">
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-ivory/35">
				QUÉ TAN COMPLETA ES
			</Text>
			<Text className="mt-3 text-[20px] font-light text-konti-ivory">{coverage.headline}</Text>
			<Text className="mt-2 text-[13px] leading-5 text-konti-ivory/45">{coverage.description}</Text>
			<View className="mt-4 gap-2 border-t border-konti-ivory/10 pt-4">
				<CoverageRow label={coverage.incomeLabel} />
				<CoverageRow label={coverage.deductionLabel} />
				<CoverageRow label={coverage.monthlyLabel} />
			</View>
			{monthlyOutstandingCount > 0 ? (
				<Text className="mt-4 rounded-2xl bg-konti-primary/10 px-4 py-3 text-[12px] leading-5 text-konti-primary">
					{monthlyOutstandingCount}{" "}
					{monthlyOutstandingCount === 1 ? "mes necesita" : "meses necesitan"} completar datos.
				</Text>
			) : null}
			{coverage.excludedFactorLabels.length > 0 ? (
				<View className="mt-4 gap-2">
					<Text className="text-[12px] font-medium text-konti-ivory/55">
						Fuera de esta estimación
					</Text>
					{coverage.excludedFactorLabels.map((label) => (
						<Text className="text-[12px] leading-5 text-konti-ivory/40" key={label}>
							• {label}
						</Text>
					))}
				</View>
			) : null}
			<Pressable
				accessibilityRole="button"
				className="mt-4 min-h-12 items-center justify-center"
				hitSlop={8}
				onPress={onReview}
				pressRetentionOffset={16}
			>
				<Text className="text-[13px] font-medium text-konti-primary">Ver revisión anual</Text>
			</Pressable>
		</View>
	);
}

function CoverageRow({ label }: { label: string }) {
	return (
		<View className="flex-row gap-2">
			<Text className="text-[12px] text-konti-primary">•</Text>
			<Text className="flex-1 text-[12px] leading-5 text-konti-ivory/45">{label}</Text>
		</View>
	);
}
