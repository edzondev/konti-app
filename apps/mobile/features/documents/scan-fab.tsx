import { router } from "expo-router";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { triggerHaptic } from "@/core/haptics";
import { Camera } from "@/shared/ui/reicon";

export function ScanFab() {
	const insets = useSafeAreaInsets();
	const pressed = useSharedValue(0);
	const bottom = Math.max(insets.bottom, 8) + 56;

	const onPress = () => {
		void triggerHaptic("selection");
		router.push("/guardar");
	};

	const tap = Gesture.Tap()
		.onBegin(() => pressed.set(withTiming(1, { duration: 80 })))
		.onFinalize(() => pressed.set(withTiming(0, { duration: 140 })))
		.onEnd(() => runOnJS(onPress)());

	const style = useAnimatedStyle(() => ({
		transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, 0.98]) }],
	}));

	return (
		<GestureDetector gesture={tap}>
			<Animated.View style={[{ bottom }, style]} className="absolute right-5">
				<View
					accessible
					accessibilityRole="button"
					accessibilityLabel="Escanear comprobante"
					className="h-14 w-14 items-center justify-center rounded-full bg-black"
				>
					<Camera color="#fff" size={22} />
				</View>
			</Animated.View>
		</GestureDetector>
	);
}
