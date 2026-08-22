import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/core/auth-client";
import { TaxIncomeRow } from "@/features/tax-income/components/tax-income-row";
import { formatPen } from "@/features/tax-income/money";
import { taxIncomeListQueryOptions } from "@/features/tax-income/tax-income.queries";

export default function TaxIncomeScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const query = useInfiniteQuery(taxIncomeListQueryOptions(session?.user.id ?? "", 2026));
	const records = query.data?.pages.flatMap((page) => page.items) ?? [];
	const summary = query.data?.pages[0]?.summary;

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
						CUARTA 2026
					</Text>
					<Text className="mt-2 text-[32px] font-light tracking-tight text-konti-ivory">
						Ingresos
					</Text>
					<Text className="mt-2 text-[13px] text-konti-ivory/40">
						{summary
							? `${summary.count} registrados · ${formatPen(summary.grossAmount)}`
							: "Lo que efectivamente cobraste"}
					</Text>
				</View>
				<Pressable
					accessibilityLabel="Agregar ingreso"
					accessibilityRole="button"
					className="min-h-12 items-center justify-center rounded-full bg-konti-ivory px-5"
					onPress={() => router.push("/tax-income-form" as Href)}
				>
					<Text className="text-[14px] font-semibold text-konti-bg">Agregar</Text>
				</Pressable>
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
							<ScreenMessage message="Aún no registraste ingresos de cuarta en 2026." />
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
							record={item}
							onPress={() =>
								router.push(`/tax-income-form?id=${encodeURIComponent(item.id)}` as Href)
							}
						/>
					)}
					showsVerticalScrollIndicator={false}
				/>
			)}
		</View>
	);
}

function ScreenMessage({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center px-5 py-16">
			<Text className="text-center text-[14px] leading-6 text-konti-ivory/45">{message}</Text>
		</View>
	);
}
