import { type Href, useRouter } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, ReduceMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { triggerHaptic } from "@/core/haptics";

import { HomeAttentionCard } from "./components/home-attention-card";
import { HomeCoverageCard } from "./components/home-coverage-card";
import { HomeDeductionCard } from "./components/home-deduction-card";
import { HomeHeader } from "./components/home-header";
import { HomeWorkIncomeCard } from "./components/home-work-income-card";
import { homeActionRoute } from "./home-action";
import { type HomeProjection, homeLoadStateCopy, projectHome } from "./home-projection";
import { initialsFromName } from "./initials";
import type { HomePrimaryAction } from "./types";
import { useHome } from "./use-home";

const TAB_BAR_SPACE = 112;
const CONTENT_ENTER = FadeInDown.duration(180)
	.easing(Easing.bezier(0.23, 1, 0.32, 1))
	.reduceMotion(ReduceMotion.System);

export function HomeScreen({ userId, firstName }: { userId: string; firstName?: string }) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const homeQuery = useHome(userId);
	const projection = homeQuery.data ? projectHome(homeQuery.data) : null;

	const openAction = (action: HomePrimaryAction) => {
		const route = homeActionRoute(action);
		if (!route) return;
		void triggerHaptic("selection");
		router.push(route as Href);
	};

	return (
		<View className="flex-1 bg-konti-bg">
			<View style={{ paddingTop: insets.top }}>
				<HomeHeader firstName={firstName} initials={initialsFromName(firstName)} />
			</View>

			{homeQuery.isPending && !projection ? (
				<HomeSkeleton />
			) : !projection ? (
				<ErrorState onRetry={() => void homeQuery.refetch()} />
			) : (
				<ScrollView
					contentInsetAdjustmentBehavior="automatic"
					contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + Math.max(insets.bottom, 12) }}
					refreshControl={
						<RefreshControl
							onRefresh={() => void homeQuery.refetch()}
							refreshing={homeQuery.isRefetching}
							tintColor="#F4F0E8"
						/>
					}
					showsVerticalScrollIndicator={false}
				>
					<HomeContent home={projection} onAction={openAction} refreshFailed={homeQuery.isError} />
				</ScrollView>
			)}
		</View>
	);
}

function HomeContent({
	home,
	onAction,
	refreshFailed,
}: {
	home: HomeProjection;
	onAction: (action: HomePrimaryAction) => void;
	refreshFailed: boolean;
}) {
	return (
		<Animated.View className="gap-6 px-6 pb-8 pt-12" entering={CONTENT_ENTER}>
			{refreshFailed ? (
				<Text
					accessibilityRole="alert"
					className="rounded-2xl border border-konti-primary/25 bg-konti-primary/10 px-4 py-3 text-[12px] leading-5 text-konti-primary"
				>
					{homeLoadStateCopy("refresh_error")}
				</Text>
			) : null}
			<View className="gap-4">
				<Text
					className={`font-mono text-[10px] tracking-[2.5px] ${home.hero.tone === "attention" ? "text-konti-primary" : "text-konti-ivory/35"}`}
				>
					{home.hero.eyebrow}
				</Text>
				<Text className="text-[38px] font-light leading-[44px] tracking-tight text-konti-ivory">
					{home.hero.title}
				</Text>
				<Text className="max-w-[330px] text-[16px] leading-6 text-konti-ivory/48">
					{home.hero.description}
				</Text>
			</View>

			{home.attention ? (
				<HomeAttentionCard
					attention={home.attention}
					onPress={() => onAction(home.attention?.action ?? null)}
				/>
			) : null}

			{home.workIncome ? (
				<HomeWorkIncomeCard
					annualDifference={home.annualDifference}
					onReview={() => onAction({ kind: "open_annual_review" })}
					workIncome={home.workIncome}
				/>
			) : null}

			{home.deductions ? (
				<HomeDeductionCard
					deductions={home.deductions}
					onReview={() => onAction({ kind: "verify_deduction" })}
				/>
			) : null}

			{home.coverage ? (
				<HomeCoverageCard
					coverage={home.coverage}
					monthlyOutstandingCount={home.monthlyOutstandingCount}
					onReview={() => onAction({ kind: "open_annual_review" })}
				/>
			) : null}

			{!home.attention && home.primaryAction ? (
				<Pressable
					accessibilityRole="button"
					className="min-h-14 items-center justify-center rounded-[18px] bg-konti-ivory px-6"
					onPress={() => onAction(home.primaryAction)}
					pressRetentionOffset={16}
				>
					<Text className="text-[15px] font-semibold text-konti-bg">
						{primaryActionLabel(home.primaryAction)}
					</Text>
				</Pressable>
			) : null}

			{home.sectionOrder.length === 0 && !home.primaryAction ? (
				<Text className="rounded-2xl border border-konti-ivory/10 bg-konti-surface px-4 py-4 text-[13px] leading-5 text-konti-ivory/40">
					{homeLoadStateCopy("empty")}
				</Text>
			) : null}

			<Text className="text-[12px] text-konti-ivory/25">
				{home.processedDocuments} comprobantes guardados
			</Text>
		</Animated.View>
	);
}

function primaryActionLabel(action: HomePrimaryAction): string {
	if (action && typeof action === "object") return "Continuar";
	switch (action) {
		case "open_capture":
			return "Añadir comprobante";
		case "open_tax_income":
			return "Registrar ingreso";
		case "open_tax_status":
			return "Ver estimación";
		case "review_document":
			return "Revisar comprobantes";
		default:
			return "Continuar";
	}
}

function HomeSkeleton() {
	return (
		<View
			accessibilityLabel={homeLoadStateCopy("loading")}
			accessibilityRole="progressbar"
			className="flex-1 gap-6 px-6 pb-24 pt-12"
		>
			<View className="h-3 w-28 rounded-full bg-konti-ivory/8" />
			<View className="gap-3">
				<View className="h-10 w-4/5 rounded-xl bg-konti-ivory/8" />
				<View className="h-5 w-full rounded-lg bg-konti-ivory/5" />
				<View className="h-5 w-2/3 rounded-lg bg-konti-ivory/5" />
			</View>
			<View className="h-44 rounded-[26px] border border-konti-ivory/8 bg-konti-surface" />
		</View>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<View className="flex-1 items-center justify-center gap-5 px-6 pb-24">
			<Text
				accessibilityRole="alert"
				selectable
				className="text-center text-[15px] leading-6 text-konti-ivory/50"
			>
				{homeLoadStateCopy("error")}
			</Text>
			<Pressable
				accessibilityHint="Vuelve a solicitar la información de Inicio"
				accessibilityRole="button"
				className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
				hitSlop={8}
				onPress={onRetry}
				pressRetentionOffset={16}
			>
				<Text className="text-sm font-semibold text-konti-bg">Reintentar</Text>
			</Pressable>
		</View>
	);
}
