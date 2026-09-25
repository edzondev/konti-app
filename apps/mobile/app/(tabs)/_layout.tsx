import { router, Tabs, usePathname } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

import { triggerHaptic } from "@/core/haptics";
import { Camera, Home, Receipt, User } from "@/shared/ui/reicon";

type TabName = "index" | "comprobantes" | "perfil";
const TAB_BAR_OFFSET = 56;

function TabIcon({ name, focused }: { name: TabName; focused: boolean }) {
	const colorClassName = focused ? "accent-konti-ink" : "accent-konti-ink-faint";
	const size = 22;
	if (name === "index") return <Home colorClassName={colorClassName} size={size} />;
	if (name === "comprobantes") return <Receipt colorClassName={colorClassName} size={size} />;
	return <User colorClassName={colorClassName} size={size} />;
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
	return (
		<Text
			className={
				focused
					? "mt-0.5 font-sans-medium text-[11px] text-konti-ink"
					: "mt-0.5 font-sans-medium text-[11px] text-konti-ink-faint"
			}
		>
			{label}
		</Text>
	);
}

function ScanFab() {
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	if (pathname.includes("guardar")) return null;

	const bottom = Math.max(insets.bottom, 48) + TAB_BAR_OFFSET;

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Escanear boleta"
			className="absolute right-6 h-15 w-15 items-center justify-center rounded-full bg-konti-ink shadow-konti-fab active:scale-95"
			style={{ bottom }}
			onPress={() => {
				void triggerHaptic("selection");
				router.push("/guardar");
			}}
		>
			<Camera colorClassName="accent-konti-on-ink" size={25} />
		</Pressable>
	);
}

export default function TabLayout() {
	const insets = useSafeAreaInsets();
	const tabBarStyle = useResolveClassNames("border-t border-konti-border bg-konti-surface-bar");

	return (
		<View className="flex-1" pointerEvents="box-none">
			<Tabs
				screenOptions={{
					animation: "none",
					headerShown: false,
					sceneStyle: { backgroundColor: "transparent" },
					tabBarStyle: {
						...tabBarStyle,
						height: 56 + Math.max(insets.bottom, 24),
						paddingBottom: Math.max(insets.bottom, 24),
						paddingTop: 8,
						shadowColor: "transparent",
					},
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Inicio",
						tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
						tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
					}}
				/>
				<Tabs.Screen
					name="guardar"
					options={{
						title: "Añadir",
						href: null,
						tabBarStyle: { display: "none" },
					}}
				/>
				<Tabs.Screen
					name="comprobantes"
					options={{
						title: "Comprobantes",
						tabBarIcon: ({ focused }) => <TabIcon name="comprobantes" focused={focused} />,
						tabBarLabel: ({ focused }) => <TabLabel label="Comprobantes" focused={focused} />,
					}}
				/>
				<Tabs.Screen
					name="perfil"
					options={{
						title: "Perfil",
						tabBarIcon: ({ focused }) => <TabIcon name="perfil" focused={focused} />,
						tabBarLabel: ({ focused }) => <TabLabel label="Perfil" focused={focused} />,
					}}
				/>
			</Tabs>
			<ScanFab />
		</View>
	);
}
