import { memo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";
import Animated from "react-native-reanimated";

import { remoteDocumentImageSource } from "../document-image-source";
import { listAmount, listSubtitle, listTitle } from "../document-list-copy";
import type { DocumentListItem, ListSubtitleTone } from "../types";

const GOLD_TEXT_STYLE = { color: "#E2A654" } as const;

const SUBTITLE_CLASS_NAME: Record<ListSubtitleTone, string> = {
	muted: "text-[13px] text-konti-ivory/50",
	primary: "text-[13px] text-konti-primary",
	gold: "text-[13px]",
};

type DocumentRowProps = {
	document: DocumentListItem;
	onPress: (documentId: string) => void;
};

export const DocumentRow = memo(function DocumentRow({ document, onPress }: DocumentRowProps) {
	const [pressed, setPressed] = useState(false);
	const title = listTitle(document);
	const subtitle = listSubtitle(document);
	const amount = listAmount(document);

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`Ver comprobante de ${title}`}
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
				<NitroImage
					accessibilityLabel={`Vista previa del comprobante de ${title}`}
					image={remoteDocumentImageSource(document.previewUrl, document.id, "low")}
					recyclingKey={document.id}
					resizeMode="cover"
					style={{ height: 64, width: 64, borderRadius: 12 }}
				/>

				<View className="min-w-0 flex-1 gap-1">
					<Text className="text-[15px] font-medium text-konti-ivory">{title}</Text>
					{subtitle.text ? (
						<Text
							className={SUBTITLE_CLASS_NAME[subtitle.tone]}
							style={subtitle.tone === "gold" ? GOLD_TEXT_STYLE : undefined}
						>
							{subtitle.text}
						</Text>
					) : null}
				</View>

				{amount ? <Text className="text-[15px] font-medium text-konti-ivory">{amount}</Text> : null}
			</Animated.View>
		</Pressable>
	);
});
