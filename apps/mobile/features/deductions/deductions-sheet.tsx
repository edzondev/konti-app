import { BottomSheet, RNHostView } from "@expo/ui";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useResolveClassNames } from "uniwind";

import {
	toDeductionSheetList,
	type DeductiblesInput,
} from "@/features/deductions/deductions-sheet-list";
import { formatMoney } from "@/features/home/home-format";
import { Receipt } from "@/shared/ui/reicon";

export type DeductionsSheetProps = {
	isPresented: boolean;
	onDismiss: () => void;
	deductibles: DeductiblesInput;
	monthName: string;
	onOpenYear: () => void;
	onUnderstood: () => void;
};

function Eyebrow() {
	return (
		<View className="flex-row items-center gap-2">
			<View className="size-1.5 shrink-0 rounded-full bg-konti-amber" />
			<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
				DEDUCCIONES
			</Text>
		</View>
	);
}

function YearLink({ onPress }: { onPress: () => void }) {
	return (
		<Pressable
			accessibilityLabel="Ver acumulado del año"
			accessibilityRole="link"
			className="self-start py-2"
			onPress={onPress}
		>
			<Text className="font-sans-medium text-[15px] text-konti-amber">
				Ver acumulado del año →
			</Text>
		</Pressable>
	);
}

function UnderstoodButton({ onPress }: { onPress: () => void }) {
	return (
		<Pressable
			accessibilityLabel="Entendido"
			accessibilityRole="button"
			className="h-14 items-center justify-center rounded-full bg-konti-ink"
			onPress={onPress}
		>
			<Text className="font-sans-medium text-base text-konti-on-ink">Entendido</Text>
		</Pressable>
	);
}

function Disclaimer() {
	return (
		<View className="rounded-[20px] border border-konti-border bg-konti-fill px-5 py-[18px]">
			<Text className="text-[13px] leading-5 text-konti-ink-muted">
				Konti solo identifica gastos que suelen aplicar. El cálculo real depende de tu situación
				tributaria.
			</Text>
		</View>
	);
}

function QueHacer() {
	return (
		<View>
			<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
				QUÉ HACER
			</Text>
			<Text className="mt-3 text-[15px] leading-6 text-konti-ink">
				En marzo, organízalos para tu declaración o expórtalos a tu contador.
			</Text>
		</View>
	);
}

export function DeductionsSheet({
	isPresented,
	onDismiss,
	deductibles,
	monthName,
	onOpenYear,
	onUnderstood,
}: DeductionsSheetProps) {
	const list = toDeductionSheetList(deductibles);
	const sticky = list.variant === "many";
	const { height, width } = useWindowDimensions();
	const sheetBackground = useResolveClassNames("bg-konti-bg");

	return (
		<BottomSheet
			isPresented={isPresented}
			onDismiss={onDismiss}
			snapPoints={["full"]}
			contentPadding={0}
			containerColor={sheetBackground.backgroundColor}
		>
			{isPresented ? (
				<RNHostView style={{ height, width }}>
					<View className="flex-1 bg-konti-bg px-6 pt-2 pb-2">
						<ScrollView
							className="flex-1"
							contentContainerClassName="pb-6"
							showsVerticalScrollIndicator={false}
						>
							<Eyebrow />

							{list.variant === "empty" ? (
								<View className="mt-4 items-center">
									<Receipt colorClassName="accent-konti-amber" size={48} />
									<Text className="mt-4 text-center font-sans-light text-[28px] tracking-tight text-konti-ink">
										Este mes, nada <Text className="italic text-konti-amber">deducible</Text>.
									</Text>
									<Text className="mt-3 text-center text-[15px] leading-6 text-konti-ink-muted">
										{`Ninguno de tus gastos de ${monthName} suele aplicar a deducciones.`}
									</Text>
								</View>
							) : (
								<View className="mt-4">
									<Text className="font-sans-light text-[28px] tracking-tight text-konti-ink">
										{`${list.count} gastos podrían reducir tu impuesto `}
										<Text className="italic text-konti-amber">anual</Text>.
									</Text>
									<Text className="mt-3 font-sans-medium text-[15px] text-konti-amber">
										{`S/ ${formatMoney(list.totalAmount)} en total`}
									</Text>

									<View className="mt-6 gap-5">
										{list.groups.map((group) => (
											<View key={group.categoryName}>
												<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-amber">
													{group.categoryName}
												</Text>
												<View className="mt-2.5 gap-2">
													{group.documents.map((doc) => (
														<View key={doc.id} className="flex-row items-center gap-3">
															<Receipt colorClassName="accent-konti-ink-muted" size={18} />
															<Text
																className="min-w-0 flex-1 font-sans-medium text-[15px] text-konti-ink"
																numberOfLines={1}
															>
																{doc.issuerName?.trim() || "Comprobante"}
															</Text>
															<Text className="font-mono-medium text-[15px] tabular-nums text-konti-ink">
																{formatMoney(Number(doc.totalAmount))}
															</Text>
														</View>
													))}
												</View>
											</View>
										))}
									</View>

									{list.moreCount > 0 ? (
										<Text className="mt-4 italic text-[15px] text-konti-amber">
											{`y ${list.moreCount} más`}
										</Text>
									) : null}
								</View>
							)}

							<View className="mt-8">
								<QueHacer />
							</View>

							{sticky ? null : (
								<View className="mt-6">
									<YearLink onPress={onOpenYear} />
								</View>
							)}

							<View className="mt-6">
								<Disclaimer />
							</View>

							{sticky ? null : (
								<View className="mt-6">
									<UnderstoodButton onPress={onUnderstood} />
								</View>
							)}
						</ScrollView>

						{sticky ? (
							<View className="border-t border-konti-border pb-2 pt-3">
								<YearLink onPress={onOpenYear} />
								<View className="mt-2">
									<UnderstoodButton onPress={onUnderstood} />
								</View>
							</View>
						) : null}
					</View>
				</RNHostView>
			) : null}
		</BottomSheet>
	);
}
