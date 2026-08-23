import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut, ReduceMotion } from "react-native-reanimated";

import { taxDeductionKeys } from "../tax-deduction-keys";
import {
	retryTaxDeductionOperation,
	selectVisibleTaxDeductionOperation,
	type TaxDeductionVisibleOperation,
	taxDeductionOperationCopy,
} from "../tax-deduction-operation-state";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER = FadeInDown.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const EXIT = FadeOut.duration(120).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

export function TaxDeductionOperationStatus() {
	const queryClient = useQueryClient();
	const operations = useMutationState<TaxDeductionVisibleOperation | null>({
		filters: { mutationKey: taxDeductionKeys.all },
		select: (mutation) => {
			if (mutation.state.status !== "pending" && mutation.state.status !== "error") return null;
			return {
				mutationId: mutation.mutationId,
				status: mutation.state.status,
				submittedAt: mutation.state.submittedAt,
				error: mutation.state.error,
			};
		},
	});
	const visible = selectVisibleTaxDeductionOperation(
		operations.filter((operation): operation is TaxDeductionVisibleOperation => operation !== null),
	);
	if (!visible) return null;

	const copy = taxDeductionOperationCopy(visible.status, visible.error as Error | null);
	return (
		<View className="pointer-events-box-none absolute inset-x-4 top-14 z-50">
			<Animated.View
				accessibilityLiveRegion="polite"
				className="rounded-2xl border border-konti-ivory/10 bg-konti-surface px-4 py-3 shadow-lg"
				entering={ENTER}
				exiting={EXIT}
			>
				<Text
					accessibilityRole={visible.status === "error" ? "alert" : "text"}
					className="text-[13px] leading-5 text-konti-ivory"
				>
					{copy.message}
				</Text>
				{copy.canRetry ? (
					<Pressable
						accessibilityRole="button"
						className="mt-2 min-h-11 self-start justify-center pr-4"
						onPress={() => {
							void retryTaxDeductionOperation(queryClient, visible.mutationId).catch(
								() => undefined,
							);
						}}
					>
						<Text className="text-[13px] font-semibold text-konti-primary">Reintentar</Text>
					</Pressable>
				) : null}
			</Animated.View>
		</View>
	);
}
