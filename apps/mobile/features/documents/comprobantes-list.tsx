import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, SectionList, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { triggerHaptic } from "@/core/haptics";
import type { DocumentListItem } from "@/features/documents/document";
import {
	formatMoney,
	groupDocumentsByPeriod,
	limaYmd,
	MONTH_NAMES,
	monthFromParts,
	monthTitle,
	monthTotals,
	parseMonth,
	rowSubtitle,
	shiftMonth,
} from "@/features/documents/document-ui";
import { currentLimaMonth } from "@/features/documents/documents-cache";
import { useDocuments } from "@/features/documents/use-documents";
import { AlertTriangle, Camera, ChevronLeft, ChevronRight, Receipt } from "@/shared/ui/reicon";
import { UniSafeAreaView } from "@/shared/ui/safe-area";

export function ComprobantesList() {
	const insets = useSafeAreaInsets();
	const [month, setMonth] = useState(() => currentLimaMonth());
	const [pickerOpen, setPickerOpen] = useState(false);
	const { data: docs = [] } = useDocuments(month);
	const currentMonth = currentLimaMonth();
	const today = limaYmd(new Date());
	const sections = useMemo(() => groupDocumentsByPeriod(docs), [docs]);
	const totals = monthTotals(docs);

	function goMonth(delta: number) {
		const next = shiftMonth(month, delta);
		if (delta > 0 && next > currentMonth) return;
		void triggerHaptic("selection");
		setMonth(next);
	}

	return (
		<UniSafeAreaView className="flex-1 bg-konti-bg" edges={["top"]}>
			<StatusBar style="dark" />
			<Text className="px-5 pt-2 text-[34px] font-normal tracking-tight text-black">
				Comprobantes
			</Text>

			<SectionList
				className="flex-1"
				contentContainerClassName="px-5 pb-28 pt-4"
				contentInsetAdjustmentBehavior="automatic"
				sections={sections}
				keyExtractor={(item) => item.id}
				stickySectionHeadersEnabled={false}
				ListHeaderComponent={
					<MonthCard
						month={month}
						amount={totals.amount}
						count={totals.count}
						canGoNext={month < currentMonth}
						onPrev={() => goMonth(-1)}
						onNext={() => goMonth(1)}
						onOpenPicker={() => {
							void triggerHaptic("selection");
							setPickerOpen(true);
						}}
					/>
				}
				ListEmptyComponent={
					<View className="items-center px-8 pt-20">
						<Receipt color="#c4a574" size={40} />
						<Text className="mt-5 text-center text-[18px] font-medium text-black">
							Sin comprobantes este mes
						</Text>
						<Text className="mt-2 text-center text-[14px] text-black/45">
							Toca el botón para escanear el primero.
						</Text>
					</View>
				}
				renderSectionHeader={({ section }) => (
					<View className="mt-6 mb-2 flex-row items-center gap-2">
						<View className="h-1.5 w-1.5 rounded-full bg-orange-400" />
						<Text className="text-[11px] font-medium uppercase tracking-widest text-black/40">
							{section.title}
						</Text>
					</View>
				)}
				renderItem={({ item }) => <DocumentRow doc={item} today={today} />}
			/>

			<ScanFab
				bottom={Math.max(insets.bottom, 16) + 8}
				onPress={() => {
					void triggerHaptic("selection");
					router.push("/guardar");
				}}
			/>

			<MonthPicker
				visible={pickerOpen}
				month={month}
				maxMonth={currentMonth}
				bottomInset={Math.max(insets.bottom, 16) + 8}
				onClose={() => setPickerOpen(false)}
				onSelect={(value) => {
					void triggerHaptic("selection");
					setMonth(value);
					setPickerOpen(false);
				}}
			/>
		</UniSafeAreaView>
	);
}

function ScanFab({ bottom, onPress }: { bottom: number; onPress: () => void }) {
	const pressed = useSharedValue(0);
	const tap = Gesture.Tap()
		.onBegin(() => pressed.set(withTiming(1, { duration: 80 })))
		.onFinalize(() => pressed.set(withTiming(0, { duration: 140 })))
		.onEnd(() => runOnJS(onPress)());

	const style = useAnimatedStyle(() => ({
		transform: [{ scale: interpolate(pressed.get(), [0, 1], [1, 0.98]) }],
	}));

	return (
		<GestureDetector gesture={tap}>
			<Animated.View style={[{ bottom }, style]} className="absolute right-5">
				<View
					accessible
					accessibilityRole="button"
					accessibilityLabel="Escanear comprobante"
					className="h-14 w-14 items-center justify-center rounded-full bg-black"
				>
					<Camera color="#fff" size={22} />
				</View>
			</Animated.View>
		</GestureDetector>
	);
}

function MonthCard({
	month,
	amount,
	count,
	canGoNext,
	onPrev,
	onNext,
	onOpenPicker,
}: {
	month: string;
	amount: number;
	count: number;
	canGoNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	onOpenPicker: () => void;
}) {
	return (
		<View className="flex-row items-center rounded-2xl bg-white px-2 py-3">
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Mes anterior"
				className="h-10 w-10 items-center justify-center"
				onPress={onPrev}
			>
				<ChevronLeft color="#111" size={20} />
			</Pressable>
			<Pressable className="flex-1 items-center py-1" onPress={onOpenPicker}>
				<Text className="text-[16px] font-medium text-black">{monthTitle(month)}</Text>
				<Text className="mt-0.5 text-[13px] text-black/45">
					S/ {formatMoney(String(amount))} · {count} comprobantes
				</Text>
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Mes siguiente"
				className="h-10 w-10 items-center justify-center"
				disabled={!canGoNext}
				onPress={onNext}
				style={{ opacity: canGoNext ? 1 : 0.25 }}
			>
				<ChevronRight color="#111" size={20} />
			</Pressable>
		</View>
	);
}

function DocumentRow({ doc, today }: { doc: DocumentListItem; today: string }) {
	const failed = doc.status === "failed";
	const pending = doc.status === "pending";
	const title = pending
		? "Procesando..."
		: failed
			? "No pudimos leerlo"
			: (doc.issuerName ?? "Comprobante");

	return (
		<Pressable
			className={`mb-2 flex-row items-center rounded-2xl px-3.5 py-3.5 ${
				failed ? "bg-amber-50" : "bg-white"
			}`}
			onPress={() => {
				void triggerHaptic("selection");
				router.push({ pathname: "/comprobante/[id]", params: { id: doc.id } });
			}}
		>
			<View
				className={`mr-3 h-9 w-9 items-center justify-center rounded-full ${
					failed ? "bg-amber-100" : "bg-black/5"
				}`}
			>
				{pending ? (
					<ActivityIndicator size="small" color="#c4a574" />
				) : failed ? (
					<AlertTriangle color="#c45c1a" size={18} />
				) : (
					<Receipt color="#111" size={18} />
				)}
			</View>
			<View className="min-w-0 flex-1 pr-3">
				<Text className="text-[15px] font-medium text-black" numberOfLines={1}>
					{title}
				</Text>
				<Text className="mt-0.5 text-[12.5px] text-black/45" numberOfLines={1}>
					{rowSubtitle(doc, today)}
				</Text>
			</View>
			{doc.status === "ready" ? (
				<Text className="text-[15px] font-medium tabular-nums text-black">
					{formatMoney(doc.totalAmount)}
				</Text>
			) : null}
		</Pressable>
	);
}

function MonthPicker({
	visible,
	month,
	maxMonth,
	bottomInset,
	onClose,
	onSelect,
}: {
	visible: boolean;
	month: string;
	maxMonth: string;
	bottomInset: number;
	onClose: () => void;
	onSelect: (month: string) => void;
}) {
	const { year: initialYear } = parseMonth(month);
	const [year, setYear] = useState(initialYear);
	const max = parseMonth(maxMonth);

	useEffect(() => {
		if (visible) setYear(parseMonth(month).year);
	}, [visible, month]);

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			statusBarTranslucent
			onRequestClose={onClose}
		>
			<View className="flex-1 justify-end bg-black/40">
				<Pressable className="absolute inset-0" onPress={onClose} />
				<View className="w-full rounded-t-3xl bg-white px-5" style={{ paddingBottom: bottomInset }}>
					{/* Grabber + aire: el “notch” del sheet no debe pegarse al contenido */}
					<View className="items-center pb-5 pt-4">
						<View className="h-1 w-10 rounded-full bg-black/20" />
					</View>

					<View className="mb-5 w-full flex-row items-center justify-between">
						<Text className="text-[18px] font-medium text-black">Elegir mes</Text>
						<Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
							<Text className="text-[15px] text-black/50">Cerrar</Text>
						</Pressable>
					</View>

					<View className="mb-4 w-full flex-row items-center justify-center gap-6">
						<Pressable
							onPress={() => {
								void triggerHaptic("selection");
								setYear((y) => y - 1);
							}}
							accessibilityLabel="Año anterior"
							className="h-10 w-10 items-center justify-center"
						>
							<ChevronLeft color="#111" size={22} />
						</Pressable>
						<Text className="min-w-[80px] text-center text-[22px] font-medium text-black">
							{year}
						</Text>
						<Pressable
							accessibilityLabel="Año siguiente"
							className="h-10 w-10 items-center justify-center"
							disabled={year >= max.year}
							onPress={() => {
								void triggerHaptic("selection");
								setYear((y) => y + 1);
							}}
							style={{ opacity: year >= max.year ? 0.25 : 1 }}
						>
							<ChevronRight color="#111" size={22} />
						</Pressable>
					</View>

					<View className="w-full flex-row flex-wrap pb-2">
						{MONTH_NAMES.map((name, index) => {
							const value = monthFromParts(year, index);
							const disabled = value > maxMonth;
							const selected = value === month;
							return (
								<Pressable
									key={name}
									disabled={disabled}
									onPress={() => onSelect(value)}
									className={`w-1/3 items-center rounded-xl py-3 ${selected ? "bg-black" : ""}`}
									style={{ opacity: disabled ? 0.3 : 1 }}
								>
									<Text
										className={`text-[15px] ${selected ? "font-medium text-white" : "text-black"}`}
									>
										{name}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>
			</View>
		</Modal>
	);
}
