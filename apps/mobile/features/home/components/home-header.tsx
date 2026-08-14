import { Pressable, Text, View } from "react-native";

type HomeHeaderProps = {
	initials: string;
	onPressAccount?: () => void;
};

export function HomeHeader({ initials, onPressAccount }: HomeHeaderProps) {
	return (
		<View className="min-h-[42px] flex-row items-center justify-between px-5 pt-2">
			<Text className="text-[19px] font-semibold tracking-tight text-konti-ink">konti</Text>

			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Cuenta"
				hitSlop={8}
				onPress={onPressAccount}
				className="size-[38px] items-center justify-center rounded-konti-avatar bg-konti-surface"
			>
				<Text className="text-xs font-semibold lowercase text-konti-ink">{initials}</Text>
			</Pressable>
		</View>
	);
}
