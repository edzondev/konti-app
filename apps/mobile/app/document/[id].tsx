import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

import { authClient } from "@/core/auth-client";
import { EmploymentIncomeCandidateCard } from "@/features/documents/components/employment-income-candidate-card";
import { FourthIncomeCandidateCard } from "@/features/documents/components/fourth-income-candidate-card";
import { TaxDeductionDocumentCandidateCard } from "@/features/documents/components/tax-deduction-document-candidate-card";
import { detailFieldRows } from "@/features/documents/document-detail-copy";
import { remoteDocumentImageSource } from "@/features/documents/document-image-source";
import { createDocumentFileUrl, processDocument } from "@/features/documents/documents.api";
import { documentKeys } from "@/features/documents/documents.queries";
import { taxDeductionCandidateRoute } from "@/features/documents/tax-deduction-candidate";
import { useDocument } from "@/features/documents/use-document";
import { useDecideDocumentIncome } from "@/features/tax-income/tax-income.mutations";

const UniNitroImage = withUniwind(NitroImage);

export default function DocumentScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const queryClient = useQueryClient();
	const { id } = useLocalSearchParams<{ id: string }>();
	const documentId = typeof id === "string" ? id : "";
	const { data: session } = authClient.useSession();
	const userId = session?.user.id ?? "";
	const documentQuery = useDocument(session?.user.id ?? "", documentId);
	const documentDecisionMutation = useDecideDocumentIncome(userId);
	const fileUrlQuery = useQuery({
		queryKey: ["documents", "file-url", session?.user.id, documentId],
		queryFn: () => createDocumentFileUrl(documentId),
		enabled: Boolean(session?.user.id && documentId && documentQuery.data),
		gcTime: 0,
		staleTime: 0,
	});
	const retryMutation = useMutation({
		mutationFn: () => processDocument(documentId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: documentKeys.all });
		},
	});

	if (documentQuery.isPending) {
		return <ScreenState message="Cargando comprobante…" />;
	}

	if (documentQuery.isError || !documentQuery.data) {
		return <ScreenState message="No pudimos cargar este comprobante." />;
	}

	const { document } = documentQuery.data;
	const candidate =
		documentQuery.data.fourthIncomeCandidate ?? documentQuery.data.taxIncomeCandidate ?? null;
	const employmentCandidate = documentQuery.data.employmentIncomeCandidate ?? null;
	const deductionCandidate = documentQuery.data.taxDeductionCandidate ?? null;
	const processing = document.status === "processing";
	const openIncomeForm = () => {
		if (!candidate) return;
		const params = new URLSearchParams({ documentId });
		if (candidate.issueDate) params.set("issueDate", candidate.issueDate);
		if (candidate.dueDate) params.set("dueDate", candidate.dueDate);
		if (candidate.documentReportedPaymentDate) {
			params.set("documentReportedPaymentDate", candidate.documentReportedPaymentDate);
		}
		if (candidate.grossAmount) params.set("grossAmount", candidate.grossAmount);
		if (candidate.withheldTaxAmount) {
			params.set("withheldTaxAmount", candidate.withheldTaxAmount);
		}
		if (candidate.payerName) params.set("payerName", candidate.payerName);
		router.push(`/tax-income-form?${params.toString()}` as Href);
	};
	const confirmPaymentDecision = (decision: "paid" | "unpaid" | "unsure") => {
		if (decision === "paid") {
			openIncomeForm();
			return;
		}

		documentDecisionMutation.mutate(
			{ documentId, decision },
			{
				onError: (error: unknown) => {
					Alert.alert(
						"No pudimos guardar tu respuesta",
						error instanceof Error ? error.message : "Inténtalo nuevamente.",
					);
				},
			},
		);
	};
	const confirmNotMine = () => {
		Alert.alert(
			"Este RHE no es tu ingreso",
			"Dejará de aparecer como ingreso pendiente. El comprobante seguirá guardado para otras evaluaciones tributarias.",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Confirmar",
					onPress: () => {
						documentDecisionMutation.mutate(
							{ documentId, decision: "not_mine" },
							{
								onError: (error: unknown) => {
									Alert.alert(
										"No pudimos guardar tu respuesta",
										error instanceof Error ? error.message : "Inténtalo nuevamente.",
									);
								},
							},
						);
					},
				},
			],
		);
	};
	const openEmploymentForm = () => {
		if (!employmentCandidate) return;
		const params = new URLSearchParams({ documentId, incomeType: "employment" });
		if (employmentCandidate.recordKind) params.set("recordKind", employmentCandidate.recordKind);
		if (employmentCandidate.coverageStart) {
			params.set("coverageStart", employmentCandidate.coverageStart);
		}
		if (employmentCandidate.coverageEnd) params.set("coverageEnd", employmentCandidate.coverageEnd);
		if (employmentCandidate.coverageScope) {
			params.set("coverageScope", employmentCandidate.coverageScope);
		}
		if (employmentCandidate.grossAmount) params.set("grossAmount", employmentCandidate.grossAmount);
		if (employmentCandidate.withheldTaxAmount) {
			params.set("withheldTaxAmount", employmentCandidate.withheldTaxAmount);
		}
		if (employmentCandidate.payerName) params.set("payerName", employmentCandidate.payerName);
		if (employmentCandidate.payerTaxId) params.set("payerTaxId", employmentCandidate.payerTaxId);
		router.push(`/tax-income-form?${params.toString()}` as Href);
	};
	const openTaxDeductionForm = () => {
		if (!deductionCandidate) return;
		router.push(taxDeductionCandidateRoute(documentId, deductionCandidate) as Href);
	};

	return (
		<View className="flex-1 bg-konti-bg px-5" style={{ paddingTop: insets.top + 12 }}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Volver a comprobantes"
				hitSlop={12}
				onPress={() => {
					router.back();
				}}
				className="min-h-11 self-start justify-center"
			>
				<Text className="text-[15px] font-medium text-konti-primary">Volver</Text>
			</Pressable>

			<ScrollView
				className="flex-1"
				contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="my-4 h-[280px] overflow-hidden rounded-3xl bg-konti-surface">
					{fileUrlQuery.data ? (
						<UniNitroImage
							accessibilityLabel="Imagen del comprobante"
							className="h-[280px] w-full"
							image={remoteDocumentImageSource(fileUrlQuery.data.url, documentId, "high")}
							recyclingKey={documentId}
							resizeMode="contain"
						/>
					) : (
						<View className="flex-1 items-center justify-center px-4">
							<Text className="text-center text-[15px] text-konti-ivory/50">
								{fileUrlQuery.isError
									? "No pudimos cargar la imagen."
									: "Cargando imagen del comprobante…"}
							</Text>
						</View>
					)}
				</View>

				{processing ? (
					<Text className="text-[15px] text-konti-ivory/50">Leyendo tu comprobante…</Text>
				) : (
					<View className="gap-1">
						{detailFieldRows(document).map((field) => (
							<DetailField
								key={field.label}
								doubtful={field.doubtful}
								label={field.label}
								value={field.value}
							/>
						))}
						{document.status === "failed" ? (
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Reintentar"
								className="mt-4 min-h-12 items-center justify-center rounded-full bg-konti-ivory px-6"
								disabled={retryMutation.isPending}
								onPress={() => {
									retryMutation.mutate();
								}}
							>
								<Text className="text-sm font-semibold text-konti-bg">Reintentar</Text>
							</Pressable>
						) : null}
						{candidate ? (
							<FourthIncomeCandidateCard
								candidate={candidate}
								isPending={documentDecisionMutation.isPending}
								onDecision={confirmPaymentDecision}
								onNotMine={confirmNotMine}
							/>
						) : null}
						{employmentCandidate ? (
							<EmploymentIncomeCandidateCard
								candidate={employmentCandidate}
								onReview={openEmploymentForm}
							/>
						) : null}
						{deductionCandidate ? (
							<TaxDeductionDocumentCandidateCard
								candidate={deductionCandidate}
								onReview={openTaxDeductionForm}
							/>
						) : null}
					</View>
				)}
			</ScrollView>
		</View>
	);
}

function DetailField({
	label,
	value,
	doubtful,
}: {
	label: string;
	value: string;
	doubtful: boolean;
}) {
	return (
		<View className="flex-row items-baseline justify-between gap-4 py-2">
			<Text className="text-[13px] text-konti-ivory/50">{label}</Text>
			<Text
				className={`shrink text-right text-[15px] ${doubtful ? "text-konti-primary" : "text-konti-ivory"}`}
			>
				{value}
			</Text>
		</View>
	);
}

function ScreenState({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center bg-konti-bg px-6">
			<Text className="text-center text-[15px] leading-[21px] text-konti-ivory/60">{message}</Text>
		</View>
	);
}
