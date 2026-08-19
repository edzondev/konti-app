import { Pressable, Text, View } from "react-native";
import Animated, {
	Easing,
	FadeIn,
	FadeInDown,
	FadeOut,
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { useEffect, useMemo } from "react";

type CaptureStatus = "idle" | "saving" | "success" | "error";

type CaptureStatusOverlayProps = {
	status: CaptureStatus;
	onRetry: () => void;
	onScanAnother: () => void;
};

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export function CaptureStatusOverlay({ status, onRetry, onScanAnother }: CaptureStatusOverlayProps) {
	const reducedMotion = useReducedMotion();
	const rotation = useSharedValue(0);
	const spinnerStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.get()}deg` }],
	}));
	const successEntering = useMemo(
		() =>
			reducedMotion
				? FadeIn.duration(200).easing(EASE_OUT).reduceMotion(ReduceMotion.System)
				: FadeInDown.duration(200)
						.easing(EASE_OUT)
						.reduceMotion(ReduceMotion.System)
						.withInitialValues({
							opacity: 0,
							transform: [{ translateY: 12 }, { scale: 0.95 }],
						}),
		[reducedMotion],
	);

	useEffect(() => {
		if (status === "saving" && !reducedMotion) {
			rotation.set(
				withRepeat(
					withTiming(360, {
						duration: 800,
						easing: Easing.linear,
						reduceMotion: ReduceMotion.System,
					}),
					-1,
					false,
				),
			);
			return;
		}

		rotation.set(0);
	}, [reducedMotion, rotation, status]);

	if (status === "saving") {
		return (
			<Animated.View
				entering={FadeIn.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System)}
				exiting={FadeOut.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System)}
				className="absolute inset-0 items-center justify-center bg-konti-bg/75"
			>
				<Animated.View style={spinnerStyle} className="size-8 rounded-full border-2 border-konti-ivory/25 border-t-konti-primary" />
				<Text className="mt-3 text-sm font-medium text-konti-ivory">Guardando…</Text>
			</Animated.View>
		);
	}

	if (status === "success") {
		return (
			<Animated.View
				entering={successEntering}
				className="absolute inset-x-5 bottom-8 rounded-[28px] bg-konti-surface p-6"
			>
				<Text className="text-[26px] font-semibold tracking-tight text-konti-ivory">Guardado</Text>
				<Pressable
					accessibilityRole="button"
					className="mt-5 min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
					onPress={onScanAnother}
				>
					<Text className="text-sm font-semibold text-konti-bg">Escanear otro</Text>
				</Pressable>
			</Animated.View>
		);
	}

	if (status === "error") {
		return (
			<Animated.View
				entering={FadeIn.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.System)}
				className="absolute inset-x-5 bottom-8 rounded-[28px] bg-konti-surface p-6"
			>
				<Text className="text-center text-[15px] leading-[22px] text-konti-ivory">
					No se pudo guardar. Inténtalo de nuevo.
				</Text>
				<Pressable
					accessibilityRole="button"
					className="mt-5 min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
					onPress={onRetry}
				>
					<Text className="text-sm font-semibold text-konti-bg">Reintentar</Text>
				</Pressable>
			</Animated.View>
		);
	}

	return null;
}
