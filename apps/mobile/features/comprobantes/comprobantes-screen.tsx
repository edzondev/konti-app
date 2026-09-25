import { BottomSheet, RNHostView } from "@expo/ui";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { type ListRow } from "@/features/comprobantes/comprobantes-list";
import { DocumentEditScreen } from "@/features/comprobantes/document-edit-screen";
import { DocumentScreen } from "@/features/comprobantes/document-screen";
import { MonthPicker } from "@/features/comprobantes/month-sheet";
import { useComprobantesScreen } from "@/features/comprobantes/use-comprobantes-screen";
import { AlertTriangle, ChevronLeft, ChevronRight, Receipt } from "@/shared/ui/reicon";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

function DocumentRows({ rows, onOpen }: { rows: ListRow[]; onOpen: (id: string) => void }) {
	return rows.map((row) => (
		<Pressable
			key={row.id}
			accessibilityRole="button"
			accessibilityLabel={row.title}
			onPress={() => onOpen(row.id)}
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
				<Text className="font-sans-medium text-[15px] text-konti-ink">{row.title}</Text>
				<Text className="text-[13px] text-konti-ink-muted">{row.subtitle}</Text>
			</View>
			{row.kind === "ready" ? (
				<Text className="font-sans-medium text-konti-ink" selectable>
					{row.amountLabel}
				</Text>
			) : null}
		</Pressable>
	));
}

export function ComprobantesScreen() {
	const {
		view,
		month,
		pickerOpen,
		selectedDocument,
		editing,
		height,
		sheetBackground,
		refreshing,
		onRefresh,
		goToPreviousMonth,
		goToNextMonth,
		openPicker,
		closePicker,
		selectMonth,
		openDocument,
		closeDocument,
		startEditing,
		stopEditing,
	} = useComprobantesScreen();

	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<ScrollView
				className="flex-1"
				alwaysBounceVertical
				contentContainerClassName="grow px-6 pb-28"
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			>
				<Text className="font-sans-light text-[32px] tracking-tight text-konti-ink">
					Comprobantes
				</Text>

				<View className="mt-6 flex-row items-center rounded-2xl bg-konti-fill px-3 py-3">
					<Pressable
						accessibilityLabel="Mes anterior"
						accessibilityRole="button"
						className="h-11 w-11 items-center justify-center"
						onPress={goToPreviousMonth}
					>
						<ChevronLeft colorClassName="accent-konti-ink-muted" size={18} />
					</Pressable>
					<Pressable
						accessibilityLabel="Elegir mes"
						accessibilityRole="button"
						className="flex-1 items-center"
						onPress={openPicker}
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
						onPress={view.canGoNext ? goToNextMonth : undefined}
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

				{view.kind === "ready" && view.undatedRows.length > 0 ? (
					<View className="mt-6">
						<View className="flex-row items-center gap-2">
							<View className="h-1.5 w-1.5 rounded-full bg-konti-amber" />
							<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
								Sin fecha
							</Text>
						</View>
						<Text className="mt-2 text-[15px] leading-6 text-konti-ink-muted">
							{view.undatedRows.length === 1
								? "Complétala para ver si deduce."
								: "Complétalas para ver si deducen."}
						</Text>
						<DocumentRows rows={view.undatedRows} onOpen={openDocument} />
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
								<DocumentRows rows={section.rows} onOpen={openDocument} />
							</View>
						))
					: null}
			</ScrollView>
			<BottomSheet
				isPresented={pickerOpen}
				onDismiss={closePicker}
				containerColor={sheetBackground.backgroundColor}
			>
				<RNHostView matchContents>
					<MonthPicker month={month} onSelect={selectMonth} />
				</RNHostView>
			</BottomSheet>
			<BottomSheet
				isPresented={selectedDocument != null}
				onDismiss={closeDocument}
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
									onClose={stopEditing}
								/>
							) : (
								<DocumentScreen
									document={selectedDocument}
									onEdit={startEditing}
									onClose={closeDocument}
								/>
							)}
						</View>
					</RNHostView>
				) : null}
			</BottomSheet>
		</UniSafeAreaView>
	);
}
