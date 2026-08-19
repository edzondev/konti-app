import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 74;

export default function GuardarTabScreen() {
	const insets = useSafeAreaInsets();
	const bottomSpace = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 24;

	return (
		<View
			className="flex-1 items-center justify-center bg-konti-bg px-7"
			style={{
				paddingTop: insets.top + 24,
				paddingBottom: bottomSpace,
			}}
		>
			<Text className="text-center text-[15px] leading-[21px] text-konti-ivory/50">
				La captura llega en el siguiente paso.
			</Text>
		</View>
	);
}
