import { Pressable, Text, View } from "react-native";

import { triggerHaptic } from "@/core/haptics";
import { categoryCopy } from "@/features/tax-deduction/tax-deduction-copy";
import { formatPen } from "@/features/tax-income/money";
import { taxDeductionIdentityEvidenceCopy } from "../tax-deduction-candidate";
import type { TaxDeductionCandidate } from "../types";

export function TaxDeductionDocumentCandidateCard({
	candidate,
	onReview,
}: {
	candidate: TaxDeductionCandidate;
	onReview: () => void;
}) {
	return (
		<View className="mt-5 gap-3 rounded-3xl border border-konti-primary/25 bg-konti-primary/10 p-5">
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
				POSIBLE GASTO DEDUCIBLE
			</Text>
			<Text className="text-[20px] font-light text-konti-ivory">
				{categoryCopy[candidate.categoryHint].shortTitle} · {formatPen(candidate.grossAmount)}
			</Text>
			<Text className="text-[13px] leading-5 text-konti-ivory/55">
				Fecha de emisión: {candidate.issueDate}. Esta fecha no confirma cuándo pagaste; te lo
				preguntaremos en el siguiente paso.
			</Text>
			<Text className="text-[13px] leading-5 text-konti-ivory/55">
				{taxDeductionIdentityEvidenceCopy(candidate.consumerIdentityEvidence)}
			</Text>
			<Text className="text-[12px] leading-5 text-konti-ivory/40">
				Es evidencia OCR, no una verificación oficial de SUNAT.
			</Text>
			<Pressable
				accessibilityRole="button"
				className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-5"
				onPress={() => {
					void triggerHaptic("selection");
					onReview();
				}}
			>
				<Text className="text-[14px] font-semibold text-konti-bg">Revisar este gasto</Text>
			</Pressable>
		</View>
	);
}
