import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/core/auth-client";
import { triggerHaptic } from "@/core/haptics";
import { TaxIncomeRow } from "@/features/tax-income/components/tax-income-row";
import { formatPen } from "@/features/tax-income/money";
import {
	taxIncomeDetailQueryOptions,
	taxIncomeListQueryOptions,
} from "@/features/tax-income/tax-income.queries";
import { recordsWithFocusedIncome } from "@/features/tax-income/tax-income-focus";
import {
	initialTaxIncomeFilter,
	taxIncomeSummaryForFilter,
} from "@/features/tax-income/tax-income-summary";
import type { TaxIncomeFilter } from "@/features/tax-income/types";

const FILTERS = [
	{ value: "all", label: "Todos" },
	{ value: "employment", label: "Planilla" },
	{ value: "fourth", label: "Honorarios" },
] as const satisfies readonly { value: TaxIncomeFilter; label: string }[];

export default function TaxIncomeScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const params = useLocalSearchParams<{ type?: string; focus?: string }>();
	const [filter, setFilter] = useState<TaxIncomeFilter>(() => initialTaxIncomeFilter(params.type));
	const { data: session } = authClient.useSession();
	const userId = session?.user.id ?? "";
	const focusId = params.focus ?? "";
	const query = useInfiniteQuery(taxIncomeListQueryOptions(userId, 2026, filter));
	const focusedQuery = useQuery(taxIncomeDetailQueryOptions(userId, focusId));
	const loadedRecords = query.data?.pages.flatMap((page) => page.items) ?? [];
	const records = recordsWithFocusedIncome(
		loadedRecords,
		focusedQuery.data,
		focusId || undefined,
		filter,
	);
	const pendingCount = records.filter((record) => record.status === "pending_sync").length;
	const rawSummary = query.data?.pages[0]?.summary;
	const summary = rawSummary ? taxIncomeSummaryForFilter(rawSummary, filter) : undefined;
	useEffect(() => {
		setFilter(initialTaxIncomeFilter(params.type));
	}, [params.type]);
	const addIncome = () => {
		if (filter === "employment") {
			router.push("/tax-income-form?incomeType=employment" as Href);
			return;
		}
		if (filter === "fourth") {
			router.push("/tax-income-form" as Href);
			return;
		}
		Alert.alert("Agregar ingreso", "¿Qué tipo de ingreso quieres registrar?", [
			{
				text: "Planilla",
				onPress: () => router.push("/tax-income-form?incomeType=employment" as Href),
			},
			{ text: "Honorarios", onPress: () => router.push("/tax-income-form" as Href) },
			{ text: "Cancelar", style: "cancel" },
		]);
	};

	return (
		<View className="flex-1 bg-konti-bg px-5" style={{ paddingTop: insets.top + 12 }}>
			<View className="flex-row items-center justify-between">
				<Pressable
					accessibilityRole="button"
					className="min-h-11 justify-center"
					hitSlop={12}
					onPress={() => router.back()}
				>
					<Text className="text-[15px] text-konti-primary">Volver</Text>
				</Pressable>
				<Pressable
					accessibilityRole="button"
					className="min-h-11 justify-center"
					hitSlop={12}
					onPress={() => router.push("/tax-status" as Href)}
				>
					<Text className="text-[14px] text-konti-ivory/50">Tu situación</Text>
				</Pressable>
			</View>

			<View className="mb-4 mt-5 flex-row items-end justify-between gap-5">
				<View className="flex-1">
					<Text className="font-mono text-[10px] tracking-[2px] text-konti-primary">
						RENTAS DEL TRABAJO 2026
					</Text>
					<Text className="mt-2 text-[32px] font-light tracking-tight text-konti-ivory">
						Ingresos
					</Text>
					<Text className="mt-2 text-[13px] text-konti-ivory/40">
						{summary
							? `${summary.count} registrados · ${formatPen(summary.grossAmount)}${pendingCount > 0 ? ` · ${pendingCount} guardando` : ""}`
							: "Honorarios y planilla con tus datos registrados"}
					</Text>
				</View>
				<Pressable
					accessibilityLabel="Agregar ingreso"
					accessibilityRole="button"
					className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-5"
					onPress={addIncome}
				>
					<Text className="text-[14px] font-semibold text-konti-bg">Agregar</Text>
				</Pressable>
			</View>

			<View className="mb-4 flex-row rounded-2xl border border-konti-ivory/10 bg-konti-surface p-1">
				{FILTERS.map((option) => {
					const selected = filter === option.value;
					return (
						<Pressable
							accessibilityRole="radio"
							accessibilityState={{ checked: selected }}
							className={`min-h-11 flex-1 items-center justify-center rounded-xl ${selected ? "bg-konti-ivory" : "bg-transparent"}`}
							key={option.value}
							onPress={() => {
								setFilter(option.value);
								void triggerHaptic("selection");
							}}
						>
							<Text
								className={`text-[13px] font-medium ${selected ? "text-konti-bg" : "text-konti-ivory/50"}`}
							>
								{option.label}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{query.isError ? (
				<ScreenMessage message="No pudimos cargar tus ingresos." />
			) : (
				<FlashList
					data={records}
					keyExtractor={(record) => record.id}
					ListEmptyComponent={
						query.isPending ? (
							<ScreenMessage message="Cargando ingresos…" />
						) : (
							<ScreenMessage message={emptyMessage(filter)} />
						)
					}
					onEndReached={() => {
						if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
					}}
					onEndReachedThreshold={0.5}
					refreshControl={
						<RefreshControl
							onRefresh={() => void query.refetch()}
							refreshing={query.isRefetching}
							tintColor="#F4F0E8"
						/>
					}
					renderItem={({ item }) => (
						<TaxIncomeRow
							focused={item.id === params.focus}
							record={item}
							onPress={
								item.status === "pending_sync"
									? undefined
									: () => router.push(`/tax-income-form?id=${encodeURIComponent(item.id)}` as Href)
							}
						/>
					)}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</View>
	);
}

function emptyMessage(filter: TaxIncomeFilter): string {
	if (filter === "employment") return "Aún no registraste ingresos de planilla en 2026.";
	if (filter === "fourth") return "Aún no registraste ingresos por honorarios en 2026.";
	return "Aún no registraste ingresos en 2026.";
}

function ScreenMessage({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center px-5 py-16">
			<Text className="text-center text-[14px] leading-6 text-konti-ivory/45">{message}</Text>
		</View>
	);
}
