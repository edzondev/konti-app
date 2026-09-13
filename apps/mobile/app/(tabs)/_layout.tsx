import { Tabs } from "expo-router";

export default function TabLayout() {
	return (
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
