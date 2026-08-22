import { useState } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
	Easing,
	FadeIn,
	FadeOut,
	LinearTransition,
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

import { formatPen } from "@/features/tax-income/money";

import { differenceCopy, taxEstimateBreakdown } from "../tax-status-copy";
import type { FourthCategory2026Output } from "../types";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);
const CARD_LAYOUT = LinearTransition.duration(160)
	.easing(EASE_IN_OUT)
	.reduceMotion(ReduceMotion.System);
const BREAKDOWN_ENTER = FadeIn.duration(160).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const BREAKDOWN_EXIT = FadeOut.duration(120).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

export function TaxEstimateCard({ output }: { output: FourthCategory2026Output }) {
	const [isBreakdownVisible, setIsBreakdownVisible] = useState(false);
	const reducedMotion = useReducedMotion();
	const triggerScale = useSharedValue(1);
	const triggerAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: triggerScale.get() }],
	}));
	const animateTriggerScale = (scale: number) => {
		triggerScale.set(
			withTiming(scale, {
				duration: 120,
				easing: EASE_OUT,
				reduceMotion: ReduceMotion.System,
			}),
		);
	};

	return (
		<Animated.View
			layout={CARD_LAYOUT}
			className="rounded-[26px] border border-konti-ivory/10 bg-konti-surface p-5"
		>
			<Text className="font-mono text-[10px] tracking-[2px] text-konti-ivory/35">
				ACUMULADO 2026
			</Text>
			<Animated.View layout={CARD_LAYOUT} className="mt-5 gap-4">
				<EstimateRow label="Ingresos de cuarta" value={output.grossFourthIncome} />
				<Pressable
					accessibilityRole="button"
					accessibilityState={{ expanded: isBreakdownVisible }}
					className="self-start"
					hitSlop={8}
					onPressIn={() => {
						if (!reducedMotion) animateTriggerScale(0.97);
					}}
					onPressOut={() => animateTriggerScale(1)}
					onPress={() => setIsBreakdownVisible((current) => !current)}
					pressRetentionOffset={16}
				>
					<Animated.View className="min-h-11 justify-center" style={triggerAnimatedStyle}>
						<Text className="text-[13px] font-medium text-konti-primary">
							{isBreakdownVisible ? "Ocultar cálculo" : "Ver cálculo"}
						</Text>
					</Animated.View>
				</Pressable>
				{isBreakdownVisible ? (
					<Animated.View
						entering={BREAKDOWN_ENTER}
						exiting={BREAKDOWN_EXIT}
						layout={CARD_LAYOUT}
						className="gap-4 border-l border-konti-ivory/10 pl-4"
					>
						{taxEstimateBreakdown(output).map((row) => (
							<EstimateRow key={row.label} label={row.label} value={row.value} />
						))}
					</Animated.View>
				) : null}
				<EstimateRow
					label="Impuesto calculado antes de deducciones adicionales"
					value={output.calculatedTaxBeforeAdditionalDeductions}
				/>
				<EstimateRow label="Retenciones registradas" value={output.registeredWithholdings} />
			</Animated.View>
			<Animated.View layout={CARD_LAYOUT} className="mt-5 border-t border-konti-ivory/10 pt-5">
				<Text className="text-[13px] leading-5 text-konti-ivory/45">
					Diferencia después de retenciones registradas
				</Text>
				<Text className="mt-2 text-[30px] font-light tracking-tight text-konti-primary">
					{formatPen(output.differenceAfterRegisteredWithholdings)}
				</Text>
				<Text className="mt-3 text-[13px] leading-5 text-konti-ivory/45">
					{differenceCopy(output.differenceAfterRegisteredWithholdings)}
				</Text>
			</Animated.View>
		</Animated.View>
	);
}

function EstimateRow({ label, value }: { label: string; value: string }) {
	return (
		<Animated.View layout={CARD_LAYOUT} className="flex-row items-end justify-between gap-5">
			<Text className="flex-1 text-[13px] leading-5 text-konti-ivory/45">{label}</Text>
			<Text className="text-[16px] font-medium text-konti-ivory">{formatPen(value)}</Text>
		</Animated.View>
	);
}
