import { useRouter, type Href } from "expo-router";
import { startTransition, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HomeHeader } from "@/features/home/components/home-header";
import { HomeStateContent } from "@/features/home/components/home-state-content";
import { defaultHomeUiState, homeMockProfile, homeUiStateOrder } from "@/features/home/mock-data";
import type { HomeUiState } from "@/features/home/types";

const comprobantesHref = "/(tabs)/comprobantes" as Href;
const TAB_BAR_HEIGHT = 74;

type HomeScreenProps = {
	initialState?: HomeUiState;
};

export function HomeScreen({ initialState = defaultHomeUiState }: HomeScreenProps) {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [uiState, setUiState] = useState<HomeUiState>(initialState);
	const bottomSpace = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 8;

	function cycleDemoState() {
		startTransition(() => {
			setUiState((current) => {
				const currentIndex = homeUiStateOrder.indexOf(current);
				const nextIndex = (currentIndex + 1) % homeUiStateOrder.length;
				return homeUiStateOrder[nextIndex] ?? defaultHomeUiState;
			});
		});
	}

	return (
		<View className="flex-1 bg-konti-bg" style={{ paddingBottom: bottomSpace }}>
			<View style={{ paddingTop: insets.top }}>
				<HomeHeader initials={homeMockProfile.initials} onPressAccount={cycleDemoState} />
			</View>

			<View className="flex-1 items-center justify-center">
				<HomeStateContent
					state={uiState}
					onPressComprobantes={() => {
						router.push(comprobantesHref);
					}}
					onConfirmDecision={cycleDemoState}
					onReviewDecision={() => {
						router.push(comprobantesHref);
					}}
				/>
			</View>
		</View>
	);
}
