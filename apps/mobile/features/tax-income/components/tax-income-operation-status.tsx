import { useMutationState, useQueryClient } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, FadeOut, ReduceMotion } from "react-native-reanimated";

import { taxIncomeMutationKeys } from "../tax-income.mutations";
import {
	selectVisibleTaxIncomeOperation,
	type TaxIncomeOperationKind,
	type TaxIncomeVisibleOperation,
	taxIncomeOperationCopy,
} from "../tax-income.operation-state";
import { retryTaxIncomeOperation } from "../tax-income.optimistic";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER = FadeInDown.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const EXIT = FadeOut.duration(120).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

export function TaxIncomeOperationStatus() {
	const queryClient = useQueryClient();
	const operations = useMutationState<TaxIncomeVisibleOperation | null>({
		filters: { mutationKey: taxIncomeMutationKeys.all },
		select: (mutation) => {
			if (mutation.state.status !== "pending" && mutation.state.status !== "error") {
				return null;
			}
			const kind = mutation.options.meta?.operationKind;
			if (!isOperationKind(kind)) return null;
			return {
				mutationId: mutation.mutationId,
				kind,
				status: mutation.state.status,
				submittedAt: mutation.state.submittedAt,
				error: mutation.state.error,
			};
		},
	});
	const visible = selectVisibleTaxIncomeOperation(
		operations.filter((operation): operation is TaxIncomeVisibleOperation => operation !== null),
	);
	if (!visible) return null;

	const copy = taxIncomeOperationCopy(visible.kind, visible.status, visible.error);
	return (
		<View className="pointer-events-box-none absolute inset-x-4 top-14 z-50">
			<Animated.View
				accessibilityLiveRegion="polite"
				className={`rounded-2xl border px-4 py-3 shadow-lg ${visible.status === "error" ? "border-konti-primary/40 bg-konti-surface" : "border-konti-ivory/10 bg-konti-surface"}`}
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
							void retryTaxIncomeOperation(queryClient, visible.mutationId).catch(() => undefined);
						}}
					>
						<Text className="text-[13px] font-semibold text-konti-primary">Reintentar</Text>
					</Pressable>
				) : null}
			</Animated.View>
		</View>
	);
}

function isOperationKind(value: unknown): value is TaxIncomeOperationKind {
	return (
		value === "create" || value === "update" || value === "delete" || value === "document_decision"
	);
}
