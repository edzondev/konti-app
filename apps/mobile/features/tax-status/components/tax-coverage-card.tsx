import { Text, View } from "react-native";
import Animated, { Easing, FadeInDown, ReduceMotion } from "react-native-reanimated";

import { formatPen } from "@/features/tax-income/money";
import { monthlyPeriodRows, taxCoverageCopy } from "../tax-status-copy";
import type { MonthlyApplicablePeriod, WorkIncome2026Output } from "../types";

const CARD_ENTER = FadeInDown.withInitialValues({
	opacity: 0,
	transform: [{ translateY: 6 }],
})
	.duration(180)
	.easing(Easing.bezier(0.23, 1, 0.32, 1))
	.reduceMotion(ReduceMotion.System);

const VERIFICATION_COPY = {
	user_confirmed: "confirmado por ti",
	evidence_attached: "con evidencia adjunta",
	system_verified: "verificado mediante una integración disponible",
} as const;

export function TaxCoverageCard({
	output,
	monthlyPeriods,
}: {
	output: WorkIncome2026Output;
	monthlyPeriods: readonly MonthlyApplicablePeriod[];
}) {
	const coverage = taxCoverageCopy(output.coverage);
	const includedVerification = [
		...new Set(
			(output.additionalDeductions.decisions ?? [])
				.filter((decision) => decision.disposition === "included")
				.map((decision) => decision.verificationStatus)
				.filter((status) => status !== "unknown"),
		),
	];
	const periodRows = monthlyPeriodRows(monthlyPeriods);

	return (
		<Animated.View
			className="gap-5 rounded-[26px] border border-konti-ivory/10 bg-konti-surface p-5"
			entering={CARD_ENTER}
		>
			<View>
				<Text className="font-mono text-[10px] tracking-[2px] text-konti-ivory/35">
					QUÉ INCLUYE
				</Text>
				<Text className="mt-3 text-[20px] font-medium text-konti-ivory">{coverage.headline}</Text>
				<Text className="mt-2 text-[13px] leading-5 text-konti-ivory/45">
					Konti calcula solo con lo que registraste. No completa ni proyecta información faltante.
				</Text>
			</View>

			<View className="gap-3">
				{coverage.rows.map((row) => (
					<Text className="text-[13px] leading-5 text-konti-ivory/55" key={row}>
						{row}
					</Text>
				))}
			</View>

			<View className="gap-3 border-t border-konti-ivory/10 pt-5">
				<Text className="text-[14px] font-medium text-konti-ivory">Gastos deducibles</Text>
				<MoneyRow
					label="Incluido con tus datos registrados"
					value={output.additionalDeductions.includedAdditionalDeduction}
				/>
				<MoneyRow
					label="Aún por revisar"
					value={output.additionalDeductions.potentialAmountBeforeCap}
				/>
				{includedVerification.length > 0 ? (
					<Text className="text-[12px] leading-5 text-konti-ivory/35">
						Lo incluido fue{" "}
						{includedVerification.map((status) => VERIFICATION_COPY[status]).join(", ")}.
					</Text>
				) : null}
			</View>

			{periodRows.length > 0 ? (
				<View className="gap-3 border-t border-konti-ivory/10 pt-5">
					<Text className="text-[14px] font-medium text-konti-ivory">
						Revisión mensual de cuarta
					</Text>
					{periodRows.map((row) => (
						<View className="flex-row justify-between gap-4" key={row.period}>
							<Text className="text-[13px] text-konti-ivory/45">{row.period}</Text>
							<Text className="max-w-[210px] text-right text-[13px] text-konti-ivory/65">
								{row.status}
							</Text>
						</View>
					))}
				</View>
			) : null}

			{coverage.exclusions.length > 0 ? (
				<View className="gap-2 rounded-2xl bg-konti-primary/10 p-4">
					<Text className="text-[13px] font-medium text-konti-primary">
						Fuera de esta estimación
					</Text>
					{coverage.exclusions.map((message) => (
						<Text className="text-[12px] leading-5 text-konti-primary/80" key={message}>
							{message}
						</Text>
					))}
				</View>
			) : null}
		</Animated.View>
	);
}

function MoneyRow({ label, value }: { label: string; value: string }) {
	return (
		<View className="flex-row items-end justify-between gap-4">
			<Text className="flex-1 text-[13px] leading-5 text-konti-ivory/45">{label}</Text>
			<Text className="text-[15px] font-medium text-konti-ivory">{formatPen(value)}</Text>
		</View>
	);
}
