import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Pressable, Text, View } from "react-native";

import { triggerHaptic } from "@/core/haptics";
import { formatPen } from "@/features/tax-income/money";

import { fourthIncomeCandidateCopy } from "../fourth-income-candidate-copy";
import type { FourthIncomeCandidate } from "../types";

export function FourthIncomeCandidateCard({
	candidate,
	isPending,
	onDecision,
	onNotMine,
}: {
	candidate: FourthIncomeCandidate;
	isPending: boolean;
	onDecision: (decision: "paid" | "unpaid" | "unsure") => void;
	onNotMine: () => void;
}) {
	const copy = fourthIncomeCandidateCopy(candidate);
	const { control, handleSubmit, reset } = useForm<{
		decision: "paid" | "unpaid" | "unsure" | null;
	}>({ defaultValues: { decision: copy.selectedDecision } });
	const selectedDecision = useWatch({ control, name: "decision" });
	useEffect(() => {
		reset({ decision: copy.selectedDecision });
	}, [copy.selectedDecision, reset]);
	const submitDecision = handleSubmit(({ decision }) => {
		if (decision) onDecision(decision);
	});

	return (
		<View className="mt-7 rounded-[24px] border border-konti-primary/30 bg-konti-primary/10 p-5">
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
				INGRESO DE CUARTA
			</Text>
			<Text className="mt-3 text-[20px] leading-7 text-konti-ivory">{copy.title}</Text>
			<Text className="mt-2 text-[13px] leading-5 text-konti-ivory/50">{copy.description}</Text>

			<View className="mt-4 gap-2 border-t border-konti-ivory/10 pt-4">
				<Text className="text-[13px] text-konti-ivory/45">{copy.issueDateLabel}</Text>
				<Text className="text-[13px] text-konti-ivory/45">{copy.paymentTermsLabel}</Text>
				<Text className="text-[13px] text-konti-ivory/55">{copy.dueDateLabel}</Text>
				<Text className="text-[13px] leading-5 text-konti-ivory/70">
					{copy.documentPaymentEvidenceLabel}
				</Text>
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

			{copy.priorDecisionLabel ? (
				<View className="mt-4 rounded-2xl border border-konti-primary/20 bg-konti-primary/10 px-4 py-3">
					<Text className="text-[13px] leading-5 text-konti-primary">
						{copy.priorDecisionLabel}
					</Text>
					<Text className="mt-1 text-[12px] leading-5 text-konti-ivory/45">
						Puedes cambiar esta respuesta cuando tengas la información.
					</Text>
				</View>
			) : null}

			{copy.canDecide ? (
				<View className="mt-5 gap-3">
					<Controller
						control={control}
						name="decision"
						render={({ field }) => (
							<View className="gap-2">
								{copy.decisions.map((option) => {
									const selected = field.value === option.decision;
									return (
										<Pressable
											accessibilityRole="radio"
											accessibilityState={{ checked: selected, disabled: isPending }}
											className={`min-h-12 flex-row items-center rounded-2xl border px-4 ${selected ? "border-konti-primary bg-konti-primary/15" : "border-konti-ivory/10 bg-konti-surface"}`}
											disabled={isPending}
											key={option.decision}
											onPress={() => {
												field.onChange(option.decision);
												void triggerHaptic("selection");
											}}
										>
											<View
												className={`mr-3 size-4 rounded-full border ${selected ? "border-[5px] border-konti-primary" : "border-konti-ivory/30"}`}
											/>
											<Text className="flex-1 text-[14px] text-konti-ivory">{option.label}</Text>
										</Pressable>
									);
								})}
							</View>
						)}
					/>
					<Pressable
						accessibilityRole="button"
						className={`min-h-13 items-center justify-center rounded-full px-5 ${isPending || !selectedDecision ? "bg-konti-ivory/35" : "bg-konti-ivory"}`}
						disabled={isPending || !selectedDecision}
						onPress={() => void submitDecision()}
					>
						<Text className="text-[14px] font-semibold text-konti-bg">
							{isPending
								? "Guardando…"
								: selectedDecision === "paid"
									? "Continuar"
									: "Guardar respuesta"}
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
