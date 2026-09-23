import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { yearProgress } from "@/features/deductions/deductibles-year-progress";
import { useDeductiblesYear } from "@/features/deductions/use-deductibles-year";
import { formatMoney } from "@/features/home/home-format";
import { ChevronLeft } from "@/shared/ui/reicon";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

type DeductionsYearScreenProps = {
	year: number;
};

export function DeductionsYearScreen({ year }: DeductionsYearScreenProps) {
	const router = useRouter();
	const query = useDeductiblesYear(year);
	const data = query.data;
	const progress = data ? yearProgress(data.totalAmount, data.topAmount) : 0;

	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-6 pb-8"
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
			>
				<Pressable
					accessibilityLabel="Volver"
					accessibilityRole="button"
					className="h-11 w-11 items-center justify-start"
					onPress={() => router.back()}
				>
					<ChevronLeft colorClassName="accent-konti-ink-muted" size={18} />
				</Pressable>

				<View className="mt-4 flex-row items-center gap-2">
					<View className="size-1.5 shrink-0 rounded-full bg-konti-amber" />
					<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
						{`DEDUCCIONES ${year}`}
					</Text>
				</View>

				<Text className="mt-4 font-sans-light text-[32px] tracking-tight text-konti-ink">
					Tu año <Text className="italic text-konti-amber">hasta ahora</Text>.
				</Text>

				{query.isPending ? (
					<View className="mt-8 gap-3">
						<View className="h-4 w-36 rounded-full bg-konti-skeleton" />
						<View className="h-14 w-48 rounded-xl bg-konti-skeleton" />
						<View className="mt-4 h-2 w-full rounded-full bg-konti-skeleton" />
						<View className="mt-6 h-16 w-full rounded-2xl bg-konti-skeleton" />
					</View>
				) : query.isError ? (
					<View className="mt-12">
						<Text className="font-sans text-[15px] text-konti-ink-muted">
							No se pudieron cargar las deducciones.
						</Text>
						<Pressable
							accessibilityLabel="Reintentar"
							accessibilityRole="button"
							className="mt-4 self-start"
							onPress={() => {
								void query.refetch();
							}}
						>
							<Text className="font-sans-medium text-[15px] text-konti-amber">Reintentar</Text>
						</Pressable>
					</View>
				) : data ? (
					<>
						<View className="mt-8">
							<View className="flex-row items-center gap-2">
								<View className="size-1.5 shrink-0 rounded-full bg-konti-amber" />
								<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
									TOTAL ACUMULADO
								</Text>
							</View>

							<View className="mt-4.5 flex-row items-baseline gap-2">
								<Text className="text-[30px] tracking-tight text-konti-ink-subtle">S/</Text>
								<Text className="font-sans-light text-[60px] tabular-nums tracking-tight text-konti-ink">
									{formatMoney(data.totalAmount)}
								</Text>
							</View>

							<Text className="mt-3.5 text-[15px] leading-6 text-konti-ink-muted">
								{`En ${data.documentCount} comprobantes.`}
							</Text>
						</View>

						<View className="mt-8">
							<View className="h-1 w-full overflow-hidden rounded-full bg-konti-fill">
								<View
									className="h-full rounded-full bg-konti-amber"
									style={{ width: `${progress * 100}%` }}
								/>
							</View>
							<Text className="mt-2.5 text-[13px] text-konti-ink-muted">
								Del tope anual de 3 UIT
							</Text>
						</View>

						{data.categories.length > 0 ? (
							<View className="mt-10">
								<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
									EN QUÉ SE FUE
								</Text>
								<View className="mt-4 gap-2.5">
									{data.categories.map((category) => (
										<View
											key={category.name}
											className="flex-row items-baseline justify-between gap-3"
										>
											<Text className="font-sans-medium text-[15px] tracking-tight text-konti-ink">
												{category.name}
											</Text>
											<Text className="font-mono-medium text-[15px] tabular-nums text-konti-ink">
												{formatMoney(category.amount)}
											</Text>
										</View>
									))}
								</View>
							</View>
						) : (
							<Text className="mt-10 text-[15px] leading-6 text-konti-ink-muted">
								Aún no tienes gastos deducibles este año.
							</Text>
						)}

						{data.totalAmount > 0 ? (
							<View className="mt-8 rounded-[20px] border border-konti-amber bg-konti-amber-tint px-5 py-[18px]">
								<Text className="text-[15px] leading-6 text-konti-ink">
									Este monto podría reducir tu impuesto anual. Confirma con tu contador.
								</Text>
							</View>
						) : null}
					</>
				) : null}
			</ScrollView>
		</UniSafeAreaView>
	);
}
