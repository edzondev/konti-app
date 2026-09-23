import { BottomSheet, RNHostView } from "@expo/ui";
import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { useResolveClassNames } from "uniwind";
import { shiftMonth, toListView } from "@/features/comprobantes/comprobantes-list";
import { DocumentEditScreen } from "@/features/comprobantes/document-edit-screen";
import { DocumentScreen } from "@/features/comprobantes/document-screen";
import { MonthPicker } from "@/features/comprobantes/month-sheet";
import { useDocuments } from "@/features/comprobantes/use-comprobantes";
import { currentLimaMonth } from "@/features/home/home-summary";
import { AlertTriangle, ChevronLeft, ChevronRight, Receipt } from "@/shared/ui/reicon";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

export function ComprobantesScreen() {
	const latestMonth = currentLimaMonth();
	const [month, setMonth] = useState(latestMonth);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [documentId, setDocumentId] = useState<string | null>(null);
	const [editing, setEditing] = useState(false);
	const { height } = useWindowDimensions();
	const sheetBackground = useResolveClassNames("bg-konti-bg");
	const documentsQuery = useDocuments(month);

	const selectedDocument = documentsQuery.data?.find((doc) => doc.id === documentId) ?? null;
	const view = toListView(
		documentsQuery.isPending
			? { status: "pending", month }
			: documentsQuery.isError
				? { status: "error", month }
				: { status: "success", documents: documentsQuery.data ?? [], month },
	);

	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<ScrollView
				className="flex-1"
				contentContainerClassName={view.kind === "empty" ? "grow px-6 pb-28" : "px-6 pb-28"}
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
			>
				<Text className="font-sans-light text-[32px] tracking-tight text-konti-ink">
					Comprobantes
				</Text>

				<View className="mt-6 flex-row items-center rounded-2xl bg-konti-fill px-3 py-3">
					<Pressable
						accessibilityLabel="Mes anterior"
						accessibilityRole="button"
						className="h-11 w-11 items-center justify-center"
						onPress={() => setMonth(shiftMonth(month, -1))}
					>
						<ChevronLeft colorClassName="accent-konti-ink-muted" size={18} />
					</Pressable>
					<Pressable
						accessibilityLabel="Elegir mes"
						accessibilityRole="button"
						className="flex-1 items-center"
						onPress={() => setPickerOpen(true)}
					>
						<Text className="font-sans-medium text-[15px] text-konti-ink">{view.monthLabel}</Text>
						{view.kind === "empty" || view.kind === "ready" ? (
							<Text className="text-[13px] text-konti-ink-muted">
								{`${view.totalLabel} · ${view.countLabel}`}
							</Text>
						) : null}
					</Pressable>
					<Pressable
						accessibilityLabel="Mes siguiente"
						accessibilityRole="button"
						disabled={!view.canGoNext}
						className={
							view.canGoNext
								? "h-11 w-11 items-center justify-center"
								: "h-11 w-11 items-center justify-center opacity-30"
						}
						onPress={view.canGoNext ? () => setMonth(shiftMonth(month, 1)) : undefined}
					>
						<ChevronRight colorClassName="accent-konti-ink-muted" size={18} />
					</Pressable>
				</View>

				{view.kind === "loading" ? (
					<>
						<View className="mt-3 h-16 rounded-2xl bg-konti-skeleton" />
						<View className="mt-3 h-16 rounded-2xl bg-konti-skeleton" />
						<View className="mt-3 h-16 rounded-2xl bg-konti-skeleton" />
						<View className="mt-3 h-16 rounded-2xl bg-konti-skeleton" />
					</>
				) : null}

				{view.kind === "error" ? (
					<Text className="mt-12 font-sans text-[15px] text-konti-ink-muted">{view.message}</Text>
				) : null}

				{view.kind === "empty" ? (
					<View className="flex-1 items-center justify-center">
						<Receipt colorClassName="accent-konti-amber" size={48} />
						<Text className="mt-4 font-sans-semibold text-[16px] text-konti-ink">
							Sin comprobantes este mes
						</Text>
						<Text className="mt-2 text-center text-[14px] text-konti-ink-muted">
							Toca el botón para escanear el primero.
						</Text>
					</View>
				) : null}

				{view.kind === "ready"
					? view.sections.map((section) => (
							<View key={section.title} className="mt-6">
								<View className="flex-row items-center gap-2">
									<View className="h-1.5 w-1.5 rounded-full bg-konti-amber" />
									<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
										{section.title}
									</Text>
								</View>
								{section.rows.map((row) => (
									<Pressable
										key={row.id}
										accessibilityRole="button"
										accessibilityLabel={row.title}
										onPress={() => {
											setEditing(false);
											setDocumentId(row.id);
										}}
										className={
											row.kind === "failed"
												? "mt-2 flex-row items-center gap-3 rounded-2xl border border-konti-amber bg-konti-surface-raised px-3 py-3"
												: "mt-2 flex-row items-center gap-3 rounded-2xl bg-konti-surface-raised px-3 py-3"
										}
									>
										{row.kind === "ready" ? (
											<Receipt colorClassName="accent-konti-ink-muted" size={18} />
										) : row.kind === "pending" ? (
											<ActivityIndicator colorClassName="accent-konti-ink-muted" />
										) : (
											<AlertTriangle colorClassName="accent-konti-amber" size={18} />
										)}
										<View className="flex-1">
											<Text className="font-sans-medium text-[15px] text-konti-ink">
												{row.title}
											</Text>
											<Text className="text-[13px] text-konti-ink-muted">{row.subtitle}</Text>
										</View>
										{row.kind === "ready" ? (
											<Text className="font-sans-medium text-konti-ink" selectable>
												{row.amountLabel}
											</Text>
										) : null}
									</Pressable>
								))}
							</View>
						))
					: null}
			</ScrollView>
			<BottomSheet
				isPresented={pickerOpen}
				onDismiss={() => setPickerOpen(false)}
				containerColor={sheetBackground.backgroundColor}
			>
				<RNHostView matchContents>
					<MonthPicker
						month={month}
						onSelect={(value) => {
							setMonth(value);
							setPickerOpen(false);
						}}
					/>
				</RNHostView>
			</BottomSheet>
			<BottomSheet
				isPresented={selectedDocument != null}
				onDismiss={() => {
					setDocumentId(null);
					setEditing(false);
				}}
				snapPoints={["full"]}
				containerColor={sheetBackground.backgroundColor}
			>
				{selectedDocument != null ? (
					<RNHostView style={{ height }}>
						<View className="flex-1 bg-konti-surface-raised">
							{editing ? (
								<DocumentEditScreen
									key={selectedDocument.id}
									document={selectedDocument}
									onClose={() => setEditing(false)}
								/>
							) : (
								<DocumentScreen
									document={selectedDocument}
									onEdit={() => setEditing(true)}
									onClose={() => {
										setDocumentId(null);
										setEditing(false);
									}}
								/>
							)}
						</View>
					</RNHostView>
				) : null}
			</BottomSheet>
		</UniSafeAreaView>
	);
}
