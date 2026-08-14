import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Receipt } from "@/shared/ui/reicon";

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
			<Text className="mb-6 text-[28px] font-semibold tracking-tight text-konti-ink">
				Comprobantes
			</Text>

			<View className="flex-1 items-center justify-center gap-3 px-3">
				<View className="mb-2 size-[74px] items-center justify-center rounded-konti-bubble bg-konti-surface">
					<Receipt size={28} colorClassName="accent-konti-muted" />
				</View>
				<Text className="text-center text-[22px] font-semibold text-konti-ink">
					Lista lista para diseñar
				</Text>
				<Text className="text-center text-[15px] leading-[21px] text-konti-muted">
					Tab lista. El set completo de pantallas de comprobantes se puede bajar después.
				</Text>
			</View>
		</View>
	);
}
