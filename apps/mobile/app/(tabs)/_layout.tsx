import { Tabs, usePathname } from "expo-router";
import { View } from "react-native";

import { ScanFab } from "@/features/documents/scan-fab";

export default function TabLayout() {
	const pathname = usePathname();
	const hideFab = pathname.includes("guardar");

	return (
		<View className="flex-1" pointerEvents="box-none">
			<Tabs
				screenOptions={{
					animation: "none",
					headerShown: false,
					sceneStyle: { backgroundColor: "transparent" },
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Inicio",
					}}
				/>
				<Tabs.Screen
					name="guardar"
					options={{
						title: "Añadir",
						tabBarStyle: { display: "none" },
					}}
				/>
				<Tabs.Screen
					name="comprobantes"
					options={{
						title: "Comprobantes",
					}}
				/>
			</Tabs>
			{hideFab ? null : <ScanFab />}
		</View>
	);
}
