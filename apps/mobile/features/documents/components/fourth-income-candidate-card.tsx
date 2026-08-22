import { Pressable, Text, View } from "react-native";

import { formatPen } from "@/features/tax-income/money";

import { fourthIncomeCandidateCopy } from "../fourth-income-candidate-copy";
import type { FourthIncomeCandidate } from "../types";

export function FourthIncomeCandidateCard({
	candidate,
	isPending,
	onConfirm,
	onNotMine,
}: {
	candidate: FourthIncomeCandidate;
	isPending: boolean;
	onConfirm: () => void;
	onNotMine: () => void;
}) {
	const copy = fourthIncomeCandidateCopy(candidate);

	return (
		<View className="mt-7 rounded-[24px] border border-konti-primary/30 bg-konti-primary/10 p-5">
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
				INGRESO DE CUARTA
			</Text>
			<Text className="mt-3 text-[20px] leading-7 text-konti-ivory">{copy.title}</Text>
			<Text className="mt-2 text-[13px] leading-5 text-konti-ivory/50">{copy.description}</Text>

			<View className="mt-4 gap-2 border-t border-konti-ivory/10 pt-4">
				<Text className="text-[13px] text-konti-ivory/45">{copy.issueDateLabel}</Text>
				<Text className="text-[13px] text-konti-ivory/70">{copy.paymentDateLabel}</Text>
				{candidate.grossAmount ? (
					<Text className="text-[13px] text-konti-ivory/70">
						Importe bruto: {formatPen(candidate.grossAmount)}
					</Text>
				) : null}
				{candidate.withheldTaxAmount ? (
					<Text className="text-[13px] text-konti-ivory/45">
						Retención: {formatPen(candidate.withheldTaxAmount)}
					</Text>
				) : null}
			</View>

			{copy.canDecide ? (
				<View className="mt-5 gap-2">
					<Pressable
						accessibilityRole="button"
						className={`min-h-13 items-center justify-center rounded-full px-5 ${isPending ? "bg-konti-ivory/35" : "bg-konti-ivory"}`}
						disabled={isPending}
						onPress={onConfirm}
					>
						<Text className="text-[14px] font-semibold text-konti-bg">
							Registrar como ingreso mío
						</Text>
					</Pressable>
					<Pressable
						accessibilityRole="button"
						className="min-h-12 items-center justify-center px-3"
						disabled={isPending}
						onPress={onNotMine}
					>
						<Text className="text-center text-[13px] leading-5 text-konti-ivory/50">
							Este RHE no corresponde a un ingreso mío
						</Text>
					</Pressable>
				</View>
			) : null}
		</View>
	);
}
