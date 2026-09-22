import { Pressable, Text, View } from "react-native";

import { Menu } from "@/shared/ui/reicon";

export function HomeHeader() {
	return (
		<View className="flex-row items-center justify-between px-6 pt-2">
			<Text className="text-[20px] tracking-tight text-konti-ink">
				kont<Text className="text-konti-amber">i</Text>
			</Text>
			<Pressable
				accessibilityLabel="Ajustes"
				accessibilityRole="button"
				className="-mr-2 p-2"
				onPress={() => {}}
			>
				<Menu colorClassName="text-konti-ink-faint" size={20} />
			</Pressable>
		</View>
	);
}
