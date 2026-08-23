import { useQuery } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/core/auth-client";
import { homeActionRoute } from "@/features/home/home-action";
import { useHome } from "@/features/home/use-home";
import { currentTaxProfileQuery } from "@/features/tax-profile/tax-profile.queries";
import { TaxCoverageCard } from "@/features/tax-status/components/tax-coverage-card";
import { TaxEstimateCard } from "@/features/tax-status/components/tax-estimate-card";
import { currentTaxStatusQueryOptions } from "@/features/tax-status/tax-status.queries";
import { isWorkIncomeOutput } from "@/features/tax-status/types";

export default function TaxStatusScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const userId = session?.user.id ?? "";
	const query = useQuery(currentTaxStatusQueryOptions(userId));
	const homeQuery = useHome(userId);
	const profileQuery = useQuery(currentTaxProfileQuery(userId));

	if (query.isPending) return <ScreenState message="Actualizando tu estimación…" />;
	if (query.isError || !query.data)
		return <ScreenState message="No pudimos cargar tu situación." />;

	const { evaluation, openAttentionCount, status } = query.data;
	const isWorkIncome = evaluation ? isWorkIncomeOutput(evaluation.output) : false;
	const nextAttention = homeQuery.data?.attention.nextItem ?? null;
	const attentionCount = Math.max(openAttentionCount, homeQuery.data?.attention.count ?? 0);
	const incomeMode = profileQuery.data?.profile?.incomeMode ?? "independent";
	const addIncomeRoute = homeActionRoute({ kind: "open_tax_income", incomeMode });

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
									? "Hay información por revisar."
									: "Aún faltan datos para estimar."}
						</Text>
						<Text className="mt-3 text-[15px] leading-6 text-konti-ivory/45">
							Con tus datos registrados hasta hoy. No proyectamos meses faltantes.
						</Text>
					</View>

					{attentionCount > 0 ? (
						<Pressable
							accessibilityRole="button"
							className="rounded-[22px] border border-konti-primary/40 bg-konti-primary/10 p-5"
							onPress={() => {
								const route = nextAttention
									? homeActionRoute(nextAttention.action)
									: "/comprobantes";
								if (route) router.push(route as Href);
							}}
						>
							<Text className="text-[16px] text-konti-ivory">
								{attentionCount === 1
									? "1 elemento necesita tu confirmación"
									: `${attentionCount} elementos necesitan tu confirmación`}
							</Text>
							<Text className="mt-2 text-[13px] leading-5 text-konti-primary">
								Revisar pendientes
							</Text>
						</Pressable>
					) : null}

					{evaluation ? (
						<>
							<TaxEstimateCard output={evaluation.output} />
							{isWorkIncomeOutput(evaluation.output) ? (
								<TaxCoverageCard
									monthlyPeriods={query.data.monthlyPeriods ?? []}
									output={evaluation.output}
								/>
							) : null}
							<Text className="text-[12px] leading-5 text-konti-ivory/35">
								{isWorkIncome
									? "Es una estimación con lo registrado. La cobertura incompleta y otros factores pueden cambiar el resultado."
									: "No incluye deducciones adicionales, pagos a cuenta ni obligaciones mensuales."}
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
							onPress={() => {
								if (addIncomeRoute) router.push(addIncomeRoute as Href);
							}}
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
