import { Text, View } from "react-native";

type HomeCategoryRow = {
	name: string;
	amountLabel: string;
	muted: boolean;
};

type HomeCategoriesProps = {
	categories: HomeCategoryRow[];
};

export function HomeCategories({ categories }: HomeCategoriesProps) {
	return (
		<View className="mt-10">
			<Text className="font-mono text-[11px] uppercase tracking-[0.16em] text-konti-ink-muted">
				En qué se fue
			</Text>

			<View className="mt-4 gap-2.5">
				{categories.map((category) => (
					<View key={category.name} className="flex-row items-baseline justify-between gap-3">
						<Text
							className={
								category.muted
									? "font-sans-medium text-[15px] tracking-tight text-konti-ink-muted"
									: "font-sans-medium text-[15px] tracking-tight text-konti-ink"
							}
						>
							{category.name}
						</Text>
						<Text
							className={
								category.muted
									? "font-mono-medium text-[15px] tabular-nums text-konti-ink-muted"
									: "font-mono-medium text-[15px] tabular-nums text-konti-ink"
							}
						>
							{category.amountLabel}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
