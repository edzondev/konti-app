import { Text, View } from "react-native";

import { UniSafeAreaView } from "@/shared/ui/safe-area";

export default function PerfilScreen() {
	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<View className="flex-1 px-6 pt-3">
				<Text className="font-sans-light text-[32px] tracking-tight text-konti-ink">Perfil</Text>
			</View>
		</UniSafeAreaView>
	);
}
