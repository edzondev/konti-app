import { ScrollView } from "react-native";

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
				{view.kind === "empty" ? <HomeEmpty monthLabel={view.monthLabel} /> : null}
				{view.kind === "ready" ? (
					<>
						<HomeAmountBlock
							insight={view.insight}
							monthLabel={view.monthLabel}
							totalAmountLabel={view.totalAmountLabel}
						/>
						<HomeCategories categories={view.categories} />
						<HomeDeductionsCard deductions={view.deductions} />
					</>
				) : null}
			</ScrollView>
		</UniSafeAreaView>
	);
}
