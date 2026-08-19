import { Text, View } from "react-native";

type HomeHeaderProps = {
	firstName: string | undefined;
	initials: string;
};

export function HomeHeader({ firstName, initials }: HomeHeaderProps) {
	return (
		<View className="min-h-[64px] flex-row items-center justify-between px-6 pt-3">
			<View className="gap-1">
				<Text className="text-[20px] font-semibold tracking-tight text-konti-canvas-text">
					kont<Text className="text-konti-accent">i</Text>
				</Text>
				<Text className="text-sm text-konti-canvas-muted">
					{firstName ? `Hola, ${firstName}` : "Hola"}
				</Text>
			</View>

			<View
				accessibilityLabel="Cuenta"
				className="size-10 items-center justify-center rounded-full bg-konti-surface"
			>
				<Text className="text-xs font-semibold text-konti-canvas-text">{initials}</Text>
			</View>
		</View>
	);
}
