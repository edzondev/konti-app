import { Pressable, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, ReduceMotion } from "react-native-reanimated";

import { formatPen } from "@/features/tax-income/money";

import { employmentIncomeCandidateCopy } from "../employment-income-candidate-copy";
import type { EmploymentIncomeCandidate } from "../types";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER = FadeInDown.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

export function EmploymentIncomeCandidateCard({
	candidate,
	onReview,
}: {
	candidate: EmploymentIncomeCandidate;
	onReview: () => void;
}) {
	const copy = employmentIncomeCandidateCopy(candidate);
	return (
		<Animated.View
			className="mt-7 rounded-[24px] border border-konti-primary/30 bg-konti-primary/10 p-5"
			entering={ENTER}
		>
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
				INGRESO DE QUINTA
			</Text>
			<Text className="mt-3 text-[20px] leading-7 text-konti-ivory">{copy.title}</Text>
			<Text className="mt-2 text-[13px] leading-5 text-konti-ivory/50">{copy.description}</Text>
			<Text className="mt-3 text-[12px] leading-5 text-konti-primary/85">
				{copy.verificationLabel}
			</Text>

			<View className="mt-4 gap-2 border-t border-konti-ivory/10 pt-4">
				<Text className="text-[13px] text-konti-ivory/65">
					{candidate.payerName ?? "Empresa por confirmar"}
				</Text>
				<Text className="text-[13px] text-konti-ivory/45">
					Periodo: {candidate.coverageStart ?? "por confirmar"} —{" "}
					{candidate.coverageEnd ?? "por confirmar"}
				</Text>
				{candidate.grossAmount ? (
					<Text className="text-[13px] text-konti-ivory/70">
						Ingreso bruto: {formatPen(candidate.grossAmount)}
					</Text>
				) : null}
				{candidate.withheldTaxAmount ? (
					<Text className="text-[13px] text-konti-ivory/45">
						Retención: {formatPen(candidate.withheldTaxAmount)}
					</Text>
				) : null}
			</View>

			{copy.missingLabel ? (
				<Text className="mt-4 rounded-2xl border border-konti-primary/20 bg-konti-primary/10 px-4 py-3 text-[13px] leading-5 text-konti-primary">
					{copy.missingLabel}
				</Text>
			) : null}
			{copy.canReview ? (
				<Pressable
					accessibilityRole="button"
					className="mt-5 min-h-13 items-center justify-center rounded-full bg-konti-ivory px-5"
					onPress={onReview}
				>
					<Text className="text-[14px] font-semibold text-konti-bg">Revisar y registrar</Text>
				</Pressable>
			) : (
				<Text className="mt-4 text-[13px] leading-5 text-konti-ivory/45">{copy.terminalLabel}</Text>
			)}
		</Animated.View>
	);
}
