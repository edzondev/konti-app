import { type Href, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatPen } from "@/features/tax-income/money";
import { HomeHeader } from "./components/home-header";
import { homeActionRoute } from "./home-action";
import { initialsFromName } from "./initials";
import type { HomePrimaryAction, HomeResponse } from "./types";
import { useHome } from "./use-home";

const TAB_BAR_SPACE = 112;

export function HomeScreen({ userId, firstName }: { userId: string; firstName?: string }) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const homeQuery = useHome(userId);

	return (
		<View className="flex-1 bg-konti-bg">
			<View style={{ paddingTop: insets.top }}>
				<HomeHeader firstName={firstName} initials={initialsFromName(firstName)} />
			</View>

			{homeQuery.isPending ? (
				<ScreenState message="Preparando tu inicio…" />
			) : homeQuery.isError ? (
				<ErrorState onRetry={() => void homeQuery.refetch()} />
			) : (
				<ScrollView
					contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + Math.max(insets.bottom, 12) }}
					showsVerticalScrollIndicator={false}
				>
					<HomeContent
						home={homeQuery.data}
						onAction={(action) => {
							const route = homeActionRoute(action);
							if (route) router.push(route as Href);
						}}
					/>
				</ScrollView>
			)}
		</View>
	);
}

function HomeContent({
	home,
	onAction,
}: {
	home: HomeResponse;
	onAction: (action: HomePrimaryAction) => void;
}) {
	return (
		<View className="gap-7 px-6 pb-8 pt-12">
			<View className="gap-4">
				<Text
					className={`font-mono text-[10px] tracking-[2.5px] ${home.status === "attention_required" ? "text-konti-primary" : "text-konti-ivory/35"}`}
				>
					{home.status === "attention_required" ? "REQUIERE TU ATENCIÓN" : "TU SITUACIÓN"}
				</Text>
				<Text className="text-[38px] font-light leading-[44px] tracking-tight text-konti-ivory">
					{home.primary.title}
				</Text>
				<Text className="max-w-[330px] text-[16px] leading-6 text-konti-ivory/48">
					{home.primary.description}
				</Text>
			</View>

			{home.taxSummary ? (
				<Pressable
					accessibilityHint="Abre el detalle de tu estimación"
					accessibilityRole="button"
					className="rounded-[26px] border border-konti-ivory/10 bg-konti-surface p-5"
					onPress={() => onAction("open_tax_status")}
				>
					<Text className="font-mono text-[10px] tracking-[2px] text-konti-ivory/35">
						ACUMULADO 2026
					</Text>
					<View className="mt-4 flex-row items-end justify-between gap-4">
						<View>
							<Text className="text-[12px] text-konti-ivory/40">Ingresos de cuarta</Text>
							<Text className="mt-1 text-[24px] font-light text-konti-ivory">
								{formatPen(home.taxSummary.grossFourthIncome)}
							</Text>
						</View>
						<Text className="pb-1 text-[13px] text-konti-primary">Ver estimación</Text>
					</View>
					<Text className="mt-4 border-t border-konti-ivory/10 pt-4 text-[12px] leading-5 text-konti-ivory/35">
						Diferencia después de retenciones:{" "}
						{formatPen(home.taxSummary.differenceAfterRegisteredWithholdings)}
					</Text>
				</Pressable>
			) : null}

			{home.primary.action ? (
				<Pressable
					accessibilityRole="button"
					className="min-h-14 items-center justify-center rounded-[18px] bg-konti-ivory px-6"
					onPress={() => onAction(home.primary.action)}
				>
					<Text className="text-[15px] font-semibold text-konti-bg">
						{actionLabel(home.primary.action)}
					</Text>
				</Pressable>
			) : (
				<Text className="text-[13px] text-konti-ivory/35">No hay nada que configurar.</Text>
			)}

			<Text className="text-[12px] text-konti-ivory/25">
				{home.summary.processedDocuments} comprobantes guardados
			</Text>
		</View>
	);
}

function actionLabel(action: Exclude<HomePrimaryAction, null>): string {
	switch (action) {
		case "open_capture":
			return "Añadir comprobante";
		case "open_tax_income":
			return "Registrar ingreso";
		case "open_tax_status":
			return "Ver estimación";
		case "review_document":
			return "Revisar comprobantes";
	}
}

function ScreenState({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center px-6 pb-24">
			<Text className="text-[14px] text-konti-ivory/45">{message}</Text>
		</View>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<View className="flex-1 items-center justify-center gap-5 px-6 pb-24">
			<Text selectable className="text-center text-[15px] leading-6 text-konti-ivory/50">
				No pudimos cargar tu inicio. Inténtalo de nuevo.
			</Text>
			<Pressable
				accessibilityRole="button"
				className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
				onPress={onRetry}
			>
				<Text className="text-sm font-semibold text-konti-bg">Reintentar</Text>
			</Pressable>
		</View>
	);
}
