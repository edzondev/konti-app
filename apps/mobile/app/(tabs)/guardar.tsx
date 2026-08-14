import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Add } from "@/shared/ui/reicon";

const TAB_BAR_HEIGHT = 74;

export default function GuardarTabScreen() {
	const insets = useSafeAreaInsets();
	const bottomSpace = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 24;

	return (
		<View
			className="flex-1 items-center justify-center gap-3.5 bg-konti-bg px-7"
			style={{
				paddingTop: insets.top + 24,
				paddingBottom: bottomSpace,
			}}
		>
			<View className="mb-2 size-[74px] items-center justify-center rounded-konti-bubble bg-konti-surface">
				<Add size={28} colorClassName="accent-konti-ink" />
			</View>
			<Text className="text-center text-[28px] font-semibold tracking-tight text-konti-ink">
				Guardar un comprobante
			</Text>
			<Text className="text-center text-[15px] leading-[21px] text-konti-muted">
				Desde aquí podrás escanear o importar. Esta pantalla es solo UI por ahora.
			</Text>
		</View>
	);
}
