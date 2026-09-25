import { Text, View } from "react-native";

type HomeAmountBlockProps = {
	monthLabel: string;
	totalAmountLabel: string;
	insight: string;
};

export function HomeAmountBlock({ monthLabel, totalAmountLabel, insight }: HomeAmountBlockProps) {
	return (
		<View className="mt-8">
			<View className="flex-row items-center gap-2">
				<View className="size-1.5 shrink-0 rounded-full bg-konti-amber" />
				<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
					{monthLabel}
				</Text>
			</View>

			<View className="mt-4.5 flex-row items-baseline gap-2">
				<Text className="text-[30px] tracking-tight text-konti-ink-subtle">S/</Text>
				<Text className="font-sans-light text-[60px] tabular-nums tracking-tight text-konti-ink">
					{totalAmountLabel}
				</Text>
			</View>

			<Text className="mt-3.5 max-w-75 text-[15px] leading-6 text-konti-ink-muted">{insight}</Text>
		</View>
	);
}
