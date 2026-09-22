import { Text, View } from "react-native";

import { ArrowRight } from "@/shared/ui/reicon";

const SUMMARY_EMPHASIS = "reducir tu impuesto anual";

type HomeDeductions =
	| { variant: "none"; message: string }
	| {
			variant: "highlight";
			count: number;
			categoryNames: string[];
			summaryLine: string;
			categoriesLine: string;
	  };

type HomeDeductionsCardProps = {
	deductions: HomeDeductions;
};

function DeductionsEyebrow() {
	return (
		<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
			Deducciones
		</Text>
	);
}

function HighlightSummary({ summaryLine }: { summaryLine: string }) {
	const emphasisIndex = summaryLine.indexOf(SUMMARY_EMPHASIS);

	if (emphasisIndex === -1) {
		return (
			<Text className="mt-2.5 text-[17px] leading-snug tracking-tight text-konti-ink">
				{summaryLine}
			</Text>
		);
	}

	const before = summaryLine.slice(0, emphasisIndex);
	const after = summaryLine.slice(emphasisIndex + SUMMARY_EMPHASIS.length);

	return (
		<Text className="mt-2.5 text-[17px] leading-snug tracking-tight text-konti-ink">
			{before}
			<Text className="text-konti-amber-deep">{SUMMARY_EMPHASIS}</Text>
			{after}
		</Text>
	);
}

export function HomeDeductionsCard({ deductions }: HomeDeductionsCardProps) {
	if (deductions.variant === "none") {
		return (
			<View className="mt-6 rounded-[20px] bg-konti-fill px-5 py-[18px]">
				<DeductionsEyebrow />
				<Text className="mt-2.5 text-[15px] leading-6 text-konti-ink-muted">
					{deductions.message}
				</Text>
			</View>
		);
	}

	return (
		<View className="mt-6 flex-row items-center gap-3.5 rounded-[20px] border-l-2 border-konti-amber bg-konti-amber-tint py-[18px] pl-5 pr-[18px]">
			<View className="min-w-0 flex-1">
				<DeductionsEyebrow />
				<HighlightSummary summaryLine={deductions.summaryLine} />
				<Text className="mt-2 text-[13px] text-konti-ink-muted">
					{deductions.categoriesLine}
				</Text>
			</View>
			<ArrowRight colorClassName="text-konti-ink-subtle" size={18} />
		</View>
	);
}
