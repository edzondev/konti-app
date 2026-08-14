import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Add, Home, Receipt } from "@/shared/ui/reicon";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const TAB_META = {
	index: {
		label: "Inicio",
		Icon: Home,
	},
	guardar: {
		label: "Guardar",
		Icon: Add,
	},
	comprobantes: {
		label: "Comprobantes",
		Icon: Receipt,
	},
} as const;

type TabRouteName = keyof typeof TAB_META;

function isTabRouteName(name: string): name is TabRouteName {
	return name in TAB_META;
}

export function KontiTabBar({ state, navigation }: TabBarProps) {
	const insets = useSafeAreaInsets();
	const bottomPad = Math.max(insets.bottom, 12);

	return (
		<View
			pointerEvents="box-none"
			className="absolute inset-x-0 bottom-0 px-4"
			style={{ paddingBottom: bottomPad }}
		>
			<View className="h-[74px] flex-row items-center overflow-hidden rounded-konti-nav bg-konti-nav px-2 py-[7px]">
				{state.routes.map((route, index) => {
					if (!isTabRouteName(route.name)) {
						return null;
					}

					const focused = state.index === index;
					const { label, Icon } = TAB_META[route.name];
					const isGuardar = route.name === "guardar";

					return (
						<Pressable
							key={route.key}
							accessibilityRole="button"
							accessibilityState={{ selected: focused }}
							accessibilityLabel={label}
							onPress={() => {
								const event = navigation.emit({
									type: "tabPress",
									target: route.key,
									canPreventDefault: true,
								});

								if (!focused && !event.defaultPrevented) {
									navigation.navigate(route.name, route.params);
								}
							}}
							className={`h-full flex-1 items-center justify-center gap-[3px] rounded-[28px] ${
								focused && !isGuardar ? "bg-konti-indigo-soft" : ""
							}`}
						>
							{isGuardar ? (
								<View className="size-11 items-center justify-center rounded-full bg-konti-ink">
									<Add size={24} colorClassName="accent-konti-surface" />
								</View>
							) : (
								<Icon
									size={21}
									weight={focused ? "Filled" : "Outline"}
									colorClassName={focused ? "accent-konti-indigo" : "accent-konti-muted"}
								/>
							)}
							<Text
								className={
									isGuardar
										? "text-[9px] font-semibold text-konti-ink"
										: focused
											? "text-[10px] font-semibold text-konti-indigo"
											: "text-[10px] font-medium text-konti-muted"
								}
							>
								{label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}
