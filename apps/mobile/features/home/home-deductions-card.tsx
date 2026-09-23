import { Pressable, Text, View } from "react-native";

import { ChevronRight } from "@/shared/ui/reicon";

type HomeDeductions =
	| { variant: "none"; message: string }
	| {
			variant: "highlight";
			count: number;
			categoryNames: string[];
			summary: { before: string; emphasis: string; after: string };
			categoriesLine: string;
	  };

type HomeDeductionsCardProps = {
	deductions: HomeDeductions;
	onPress: () => void;
};

function DeductionsEyebrow() {
	return (
		<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
			Deducciones
		</Text>
	);
}

function HighlightSummary({
	summary,
}: {
	summary: { before: string; emphasis: string; after: string };
}) {
	return (
		<Text className="mt-2.5 text-[17px] leading-snug tracking-tight text-konti-ink">
			{summary.before}
			<Text className="text-konti-amber-deep">{summary.emphasis}</Text>
			{summary.after}
		</Text>
	);
}

export function HomeDeductionsCard({ deductions, onPress }: HomeDeductionsCardProps) {
	if (deductions.variant === "none") {
		return (
			<Pressable
				accessibilityRole="button"
				className="mt-6 rounded-[20px] bg-konti-fill px-5 py-[18px]"
				onPress={onPress}
			>
				<DeductionsEyebrow />
				<Text className="mt-2.5 text-[15px] leading-6 text-konti-ink-muted">
					{deductions.message}
				</Text>
			</Pressable>
		);
	}

	return (
		<Pressable
			accessibilityRole="button"
			className="mt-6 flex-row items-center gap-3.5 rounded-[20px] border-l-2 border-konti-amber bg-konti-amber-tint py-[18px] pl-5 pr-[18px]"
			onPress={onPress}
		>
			<View className="min-w-0 flex-1">
				<DeductionsEyebrow />
				<HighlightSummary summary={deductions.summary} />
				<Text className="mt-2 text-[13px] text-konti-ink-muted">{deductions.categoriesLine}</Text>
			</View>
			<ChevronRight colorClassName="accent-konti-ink-subtle" size={18} />
		</Pressable>
	);
}
