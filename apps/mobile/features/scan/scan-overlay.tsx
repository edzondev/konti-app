import { type ReactElement, useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";
import Animated, {
	Easing,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Check, Image, X } from "@/shared/ui/reicon";

const BRACKET_IN = 20;
const DETECTED_AMBER = "#E2A654";
const WARM_WHITE = "#F4EDE3";
const CORNER_EDGES = ["tl", "tr", "bl", "br"] as const;

const CORNER_CLASS = {
	tl: "absolute left-0 top-0 size-10 border-l-[3px] border-t-[3px]",
	tr: "absolute right-0 top-0 size-10 border-r-[3px] border-t-[3px]",
	bl: "absolute bottom-0 left-0 size-10 border-b-[3px] border-l-[3px]",
	br: "absolute bottom-0 right-0 size-10 border-b-[3px] border-r-[3px]",
} as const;

const CORNER_DIR = {
	tl: { x: 1, y: 1 },
	tr: { x: -1, y: 1 },
	bl: { x: 1, y: -1 },
	br: { x: -1, y: -1 },
} as const;

type CornerEdge = (typeof CORNER_EDGES)[number];

function GuideCorner({
	edge,
	detected,
	tighten,
}: {
	edge: CornerEdge;
	detected: boolean;
	tighten: SharedValue<number>;
}) {
	const dx = CORNER_DIR[edge].x;
	const dy = CORNER_DIR[edge].y;
	const animatedStyle = useAnimatedStyle(() => {
		const t = tighten.get();
		return {
			opacity: 0.62 + t * 0.38,
			transform: [{ translateX: dx * t * BRACKET_IN }, { translateY: dy * t * BRACKET_IN }],
		};
	});

	return (
		<Animated.View
			className={CORNER_CLASS[edge]}
			style={[{ borderColor: detected ? DETECTED_AMBER : WARM_WHITE }, animatedStyle]}
		/>
	);
}

function FocusMark({ x, y }: { x: number; y: number }) {
	const opacity = useSharedValue(1);
	const scale = useSharedValue(1);

	useEffect(() => {
		opacity.set(withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
		scale.set(withTiming(1.35, { duration: 400, easing: Easing.out(Easing.cubic) }));
	}, [opacity, scale]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.get(),
		transform: [{ scale: scale.get() }],
	}));

	return (
		<Animated.View
			pointerEvents="none"
			className="absolute size-10 rounded-full border-2 border-white"
			style={[{ left: x - 20, top: y - 20 }, animatedStyle]}
		/>
	);
}

function SavedCard({ path, bottom }: { path: string; bottom: number }) {
	const shown = useSharedValue(0);

	useEffect(() => {
		shown.set(withSpring(1, { damping: 18, stiffness: 180 }));
	}, [shown]);

	const animatedStyle = useAnimatedStyle(() => {
		const t = shown.get();
		return {
			opacity: t,
			transform: [{ translateY: (1 - t) * 28 }],
		};
	});

	return (
		<Animated.View
			pointerEvents="none"
			className="absolute inset-x-4 flex-row items-center gap-3 rounded-2xl bg-black/70 px-3 py-3"
			style={[
				{
					bottom,
					borderCurve: "continuous",
					boxShadow: "0 10px 28px rgba(0, 0, 0, 0.45)",
				},
				animatedStyle,
			]}
		>
			<View className="size-14 overflow-hidden rounded-xl bg-white/10">
				<NitroImage
					image={{ filePath: path }}
					recyclingKey={path}
					resizeMode="cover"
					style={{ width: "100%", height: "100%" }}
				/>
			</View>
			<View className="size-7 items-center justify-center rounded-full border border-konti-amber">
				<Check colorClassName="accent-konti-amber" size={15} />
			</View>
			<View className="min-w-0 flex-1 gap-0.5">
				<Text className="font-sans-medium text-[15px] text-white">Guardado.</Text>
				<Text className="text-[15px] text-white/70">Te avisamos cuando esté listo.</Text>
			</View>
		</Animated.View>
	);
}

export function ScanOverlay({
	phase,
	savedPath,
	busy,
	error,
	focusPoint,
	onClose,
	onShutter,
	onGallery,
}: {
	phase: "searching" | "detected";
	savedPath: string | null;
	busy: boolean;
	error: string | null;
	focusPoint: { x: number; y: number } | null;
	onClose: () => void;
	onShutter: () => void;
	onGallery: () => void;
}): ReactElement {
	const insets = useSafeAreaInsets();
	const detected = phase === "detected";
	const tighten = useSharedValue(0);
	const focusKey = useRef(0);
	const focusSeen = useRef(focusPoint);
	if (focusPoint !== focusSeen.current) {
		focusSeen.current = focusPoint;
		if (focusPoint) focusKey.current += 1;
	}
	const top = insets.top + 8;
	const bottom = Math.max(insets.bottom, 20);

	useEffect(() => {
		tighten.set(
			withTiming(detected ? 1 : 0, {
				duration: 200,
				easing: Easing.out(Easing.cubic),
			}),
		);
	}, [detected, tighten]);

	return (
		<View className="absolute inset-0" pointerEvents="box-none">
			<View
				pointerEvents="box-none"
				className="absolute inset-x-0 flex-row items-center justify-between px-4"
				style={{ top }}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Cerrar"
					className="size-11 items-center justify-center rounded-full bg-black/50 active:opacity-70"
					onPress={onClose}
				>
					<X colorClassName="accent-white" size={20} />
				</Pressable>
				<View
					pointerEvents="none"
					className={detected ? "rounded-full px-3.5 py-2" : "rounded-full bg-black/50 px-3.5 py-2"}
					style={
						detected
							? {
									borderCurve: "continuous",
									backgroundColor: "rgba(226,166,84,0.20)",
								}
							: { borderCurve: "continuous" }
					}
				>
					<Text
						className={
							detected
								? "font-mono text-[11px] uppercase tracking-[0.16em]"
								: "font-mono text-[11px] uppercase tracking-[0.16em] text-white"
						}
						style={detected ? { color: DETECTED_AMBER } : undefined}
					>
						{detected ? "QR detectado" : "Buscando comprobante"}
					</Text>
				</View>
				<View pointerEvents="none" className="size-11" />
			</View>

			<View pointerEvents="none" className="absolute inset-0 items-center justify-center">
				<View className="h-72 w-56">
					{CORNER_EDGES.map((edge) => (
						<GuideCorner key={edge} edge={edge} detected={detected} tighten={tighten} />
					))}
				</View>
			</View>

			{focusPoint !== null ? (
				<FocusMark key={focusKey.current} x={focusPoint.x} y={focusPoint.y} />
			) : null}

			{savedPath !== null ? <SavedCard path={savedPath} bottom={bottom + 128} /> : null}

			<View
				pointerEvents="box-none"
				className="absolute inset-x-0 items-center px-8"
				style={{ bottom }}
			>
				<View pointerEvents="box-none" className="w-full flex-row items-center justify-between">
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Elegir de la galería"
						disabled={busy}
						className="size-12 items-center justify-center rounded-full bg-black/50 active:opacity-70 disabled:opacity-40"
						onPress={onGallery}
					>
						<Image colorClassName="accent-white" size={22} />
					</Pressable>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Tomar foto"
						disabled={busy}
						className="size-20 items-center justify-center rounded-full border-4 border-white active:scale-95 disabled:opacity-40"
						onPress={onShutter}
					>
						<View pointerEvents="none" className="size-14 rounded-full bg-white" />
					</Pressable>
					<View pointerEvents="none" className="size-12" />
				</View>
				{error !== null ? (
					<Text selectable className="mt-3 text-center text-[13px] text-white">
						{error}
					</Text>
				) : null}
			</View>
		</View>
	);
}
