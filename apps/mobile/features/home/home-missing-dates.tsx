import { Pressable, Text } from "react-native";

export function HomeMissingDates({ note, onPress }: { note: string; onPress: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={note}
			className="mt-8 active:opacity-70"
			onPress={onPress}
		>
			<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
				Sin fecha
			</Text>
			<Text className="mt-2.5 text-[15px] leading-6 text-konti-ink-muted">{note}</Text>
		</Pressable>
	);
}
