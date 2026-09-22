import { Pressable, Text, View } from "react-native";

import { Camera } from "@/shared/ui/reicon";

type HomeEmptyProps = {
	monthLabel: string;
};

export function HomeEmpty({ monthLabel }: HomeEmptyProps) {
	return (
		<View className="mt-12">
			<View className="flex-row items-center gap-2">
				<View className="size-1.5 shrink-0 rounded-full bg-konti-ink-disabled" />
				<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
					{monthLabel}
				</Text>
			</View>

			<Text className="mt-6 max-w-[290px] font-sans-light text-[38px] leading-tight tracking-tight text-konti-ink">
				Todo empieza con una <Text className="text-konti-amber-deep">foto</Text>.
			</Text>

			<Text className="mt-4 max-w-[300px] text-[15px] leading-6 text-konti-ink-muted">
				Tu primer mes con Konti. Estamos organizando todo.
			</Text>

			<Pressable
				accessibilityLabel="Escanear comprobante"
				accessibilityRole="button"
				className="mt-8 h-14 flex-row items-center gap-3 self-start rounded-full bg-konti-ink px-[30px]"
			>
				<Camera colorClassName="text-konti-on-ink" size={20} />
				<Text className="font-sans-medium text-base tracking-tight text-konti-on-ink">
					Escanear comprobante
				</Text>
			</Pressable>
		</View>
	);
}
