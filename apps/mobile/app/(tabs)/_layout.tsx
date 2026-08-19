import { Tabs } from "expo-router";

import { KontiTabBar } from "@/features/home/components/konti-tab-bar";

export default function TabLayout() {
	return (
		<Tabs
			tabBar={(props) => <KontiTabBar {...props} />}
			screenOptions={{
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
				}}
			/>
			<Tabs.Screen
				name="comprobantes"
				options={{
					title: "Comprobantes",
				}}
			/>
		</Tabs>
	);
}
