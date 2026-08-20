import { Image } from "expo-image";
import { memo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import type { DocumentListItem } from "../types";

const TIME_FORMATTER = new Intl.DateTimeFormat("es-PE", {
	hour: "numeric",
	minute: "2-digit",
});

function sourceLabel(source: DocumentListItem["source"]) {
	return source === "camera" ? "Cámara" : "Galería";
}

type DocumentRowProps = {
	document: DocumentListItem;
	onPress: (documentId: string) => void;
};

export const DocumentRow = memo(function DocumentRow({ document, onPress }: DocumentRowProps) {
	const [pressed, setPressed] = useState(false);
	const source = sourceLabel(document.source);

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`Ver comprobante de ${source}`}
			onPress={() => {
				onPress(document.id);
			}}
			onPressIn={() => {
				setPressed(true);
			}}
			onPressOut={() => {
				setPressed(false);
			}}
			pressRetentionOffset={16}
		>
			<Animated.View
				className="mb-3 flex-row items-center gap-3 rounded-2xl bg-konti-surface p-3"
				style={{
					transform: [{ scale: pressed ? 0.97 : 1 }],
					transitionProperty: "transform",
					transitionDuration: "120ms",
					transitionTimingFunction: "linear",
				}}
			>
				<Image
					accessibilityLabel={`Vista previa del comprobante de ${source}`}
					cachePolicy="memory"
					contentFit="cover"
					source={document.previewUrl}
					style={{ height: 64, width: 64, borderRadius: 12 }}
				/>

				<View className="min-w-0 flex-1 gap-1">
					<Text className="text-[15px] font-medium text-konti-ivory">{source}</Text>
					<Text className="text-[13px] text-konti-ivory/50">
						{TIME_FORMATTER.format(new Date(document.createdAt))}
					</Text>
				</View>

				<Text className="text-[13px] text-konti-primary">Guardado</Text>
			</Animated.View>
		</Pressable>
	);
});
