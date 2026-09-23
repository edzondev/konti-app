import { type Href, router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text } from "react-native";

import { currentLimaYear } from "@/features/deductions/deductibles-year";
import { DeductionsSheet } from "@/features/deductions/deductions-sheet";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

import { HomeAmountBlock } from "./home-amount-block";
import { HomeCategories } from "./home-categories";
import { HomeDeductionsCard } from "./home-deductions-card";
import { HomeEmpty } from "./home-empty";
import { HomeHeader } from "./home-header";
import { HomeSkeleton } from "./home-skeleton";
import { useHomeView } from "./use-home-view";

export function HomeScreen() {
	const view = useHomeView();
	const [sheetOpen, setSheetOpen] = useState(false);

	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<HomeHeader />
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-6 pb-8"
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
			>
				{view.kind === "loading" ? <HomeSkeleton /> : null}
				{view.kind === "error" ? (
					<Text className="mt-12 font-sans text-[15px] text-konti-ink-muted">{view.message}</Text>
				) : null}
				{view.kind === "empty" ? <HomeEmpty monthLabel={view.monthLabel} /> : null}
				{view.kind === "ready" ? (
					<>
						<HomeAmountBlock
							insight={view.insight}
							monthLabel={view.monthLabel}
							totalAmountLabel={view.totalAmountLabel}
						/>
						<HomeCategories categories={view.categories} />
						<HomeDeductionsCard deductions={view.deductions} onPress={() => setSheetOpen(true)} />
					</>
				) : null}
			</ScrollView>
			{view.kind === "ready" ? (
				<DeductionsSheet
					deductibles={view.deductibles}
					isPresented={sheetOpen}
					monthName={view.monthName}
					onDismiss={() => setSheetOpen(false)}
					onOpenYear={() => {
						setSheetOpen(false);
						router.navigate(`/deducciones/${currentLimaYear()}` as Href);
					}}
					onUnderstood={() => setSheetOpen(false)}
				/>
			) : null}
		</UniSafeAreaView>
	);
}
