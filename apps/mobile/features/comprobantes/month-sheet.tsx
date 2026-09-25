import { useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import { currentLimaMonth } from "@/features/home/home-summary";
import { ChevronLeft, ChevronRight } from "@/shared/ui/reicon";

const MONTHS = [
	"Ene",
	"Feb",
	"Mar",
	"Abr",
	"May",
	"Jun",
	"Jul",
	"Ago",
	"Sep",
	"Oct",
	"Nov",
	"Dic",
] as const;

const ROWS = [0, 1, 2, 3] as const;

// ponytail: 6 años hacia atrás; ampliar si aparecen comprobantes más viejos.
const YEAR_SPAN = 6;

export function MonthPicker({
	month,
	onSelect,
}: {
	month: string;
	onSelect: (month: string) => void;
}) {
	const latestMonth = currentLimaMonth();
	const latestYear = Number(latestMonth.slice(0, 4));
	const { width } = useWindowDimensions();
	const [year, setYear] = useState(() => Number(month.slice(0, 4)));
	const atOldest = year <= latestYear - (YEAR_SPAN - 1);
	const atNewest = year >= latestYear;

	return (
		<View style={{ width: width - 32 }}>
			<View className="flex-row items-center justify-between">
				<Pressable
					accessibilityLabel="Año anterior"
					accessibilityRole="button"
					className="h-11 w-11 items-center justify-center"
					disabled={atOldest}
					onPress={() => setYear((current) => current - 1)}
				>
					<ChevronLeft
						colorClassName={atOldest ? "accent-konti-ink-disabled" : "accent-konti-ink"}
						size={18}
					/>
				</Pressable>
				<Text className="bg-transparent font-sans-medium text-[17px] text-konti-ink">{year}</Text>
				<Pressable
					accessibilityLabel="Año siguiente"
					accessibilityRole="button"
					className="h-11 w-11 items-center justify-center"
					disabled={atNewest}
					onPress={() => setYear((current) => current + 1)}
				>
					<ChevronRight
						colorClassName={atNewest ? "accent-konti-ink-disabled" : "accent-konti-ink"}
						size={18}
					/>
				</Pressable>
			</View>
			<View className="mt-4 gap-3">
				{ROWS.map((row) => (
					<View key={row} className="flex-row gap-3">
						{MONTHS.slice(row * 3, row * 3 + 3).map((label, index) => {
							const value = `${year}-${String(row * 3 + index + 1).padStart(2, "0")}`;
							const enabled = value <= latestMonth;
							const selected = value === month;
							return (
								<Pressable
									key={value}
									accessibilityRole="button"
									accessibilityState={{ selected, disabled: !enabled }}
									className={
										selected
											? "h-12 flex-1 items-center justify-center rounded-2xl bg-konti-amber-tint"
											: "h-12 flex-1 items-center justify-center rounded-2xl bg-konti-fill"
									}
									disabled={!enabled}
									onPress={() => onSelect(value)}
								>
									<Text
										numberOfLines={1}
										className={
											selected
												? "bg-transparent font-sans-medium text-[15px] text-konti-amber-deep"
												: enabled
													? "bg-transparent text-[15px] text-konti-ink"
													: "bg-transparent text-[15px] text-konti-ink-disabled"
										}
									>
										{label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				))}
			</View>
		</View>
	);
}
