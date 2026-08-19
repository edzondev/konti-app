import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 74;

export default function ComprobantesTabScreen() {
	const insets = useSafeAreaInsets();
	const bottomSpace = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 24;

	return (
		<View
			className="flex-1 bg-konti-bg px-5"
			style={{
				paddingTop: insets.top + 16,
				paddingBottom: bottomSpace,
			}}
		>
			<Text className="text-[28px] font-semibold tracking-tight text-konti-ivory">
				Comprobantes
			</Text>

			<View className="flex-1 items-center justify-center px-3">
				<Text className="text-center text-[15px] leading-[21px] text-konti-ivory/50">
					Aún no hay comprobantes.
				</Text>
			</View>
		</View>
	);
}
