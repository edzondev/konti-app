import { useQuery } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/core/auth-client";
import { TaxEstimateCard } from "@/features/tax-status/components/tax-estimate-card";
import { currentTaxStatusQueryOptions } from "@/features/tax-status/tax-status.queries";

export default function TaxStatusScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const query = useQuery(currentTaxStatusQueryOptions(session?.user.id ?? ""));

	if (query.isPending) return <ScreenState message="Actualizando tu estimación…" />;
	if (query.isError || !query.data)
		return <ScreenState message="No pudimos cargar tu situación." />;

	const { evaluation, openAttentionCount, status } = query.data;

	return (
		<View className="flex-1 bg-konti-bg" style={{ paddingTop: insets.top + 12 }}>
			<View className="flex-row items-center justify-between px-5">
				<Pressable
					accessibilityRole="button"
					className="min-h-11 justify-center"
					hitSlop={12}
					onPress={() => router.back()}
				>
					<Text className="text-[15px] text-konti-primary">Volver</Text>
				</Pressable>
				<Text className="font-mono text-[11px] tracking-[2px] text-konti-ivory/35">2026</Text>
			</View>

			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 28 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="gap-6 px-5 pt-6">
					<View>
						<Text className="font-mono text-[10px] tracking-[2.5px] text-konti-primary">
							TU SITUACIÓN
						</Text>
						<Text className="mt-4 text-[36px] font-light leading-[42px] tracking-tight text-konti-ivory">
							{status === "calculated"
								? "Estimación actualizada."
								: status === "attention_required"
									? "Hay un recibo por revisar."
									: "Aún faltan datos para estimar."}
						</Text>
						<Text className="mt-3 text-[15px] leading-6 text-konti-ivory/45">
							Con tus datos registrados hasta hoy. No proyectamos meses faltantes.
						</Text>
					</View>

					{openAttentionCount > 0 ? (
						<Pressable
							accessibilityRole="button"
							className="rounded-[22px] border border-konti-primary/40 bg-konti-primary/10 p-5"
							onPress={() => router.push("/comprobantes")}
						>
							<Text className="text-[16px] text-konti-ivory">
								{openAttentionCount === 1
									? "1 recibo necesita tu confirmación"
									: `${openAttentionCount} recibos necesitan tu confirmación`}
							</Text>
							<Text className="mt-2 text-[13px] leading-5 text-konti-primary">
								Revisar comprobantes
							</Text>
						</Pressable>
					) : null}

					{evaluation ? (
						<>
							<TaxEstimateCard output={evaluation.output} />
							<Text className="text-[12px] leading-5 text-konti-ivory/35">
								No incluye deducción adicional de hasta 3 UIT, pagos a cuenta ni obligaciones
								mensuales.
							</Text>
							<Text className="text-[12px] leading-5 text-konti-ivory/25">
								Ruleset {evaluation.rulesetVersion} · Calculado con{" "}
								{evaluation.output.includedIncomeCount} ingresos confirmados.
							</Text>
						</>
					) : (
						<View className="rounded-[24px] border border-konti-ivory/10 bg-konti-surface p-5">
							<Text className="text-[16px] leading-6 text-konti-ivory">
								Registra un ingreso efectivamente cobrado para crear la primera estimación.
							</Text>
						</View>
					)}

					<View className="flex-row gap-3">
						<Pressable
							accessibilityRole="button"
							className="min-h-13 flex-1 items-center justify-center rounded-full bg-konti-ivory px-4"
							onPress={() => router.push("/tax-income-form" as Href)}
						>
							<Text className="text-[14px] font-semibold text-konti-bg">Agregar ingreso</Text>
						</Pressable>
						<Pressable
							accessibilityRole="button"
							className="min-h-13 flex-1 items-center justify-center rounded-full border border-konti-ivory/15 px-4"
							onPress={() => router.push("/tax-income" as Href)}
						>
							<Text className="text-[14px] text-konti-ivory">Ver ingresos</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

function ScreenState({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center bg-konti-bg px-6">
			<Text className="text-center text-[15px] leading-6 text-konti-ivory/50">{message}</Text>
		</View>
	);
}
