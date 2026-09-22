import { Tabs } from "expo-router";
import { View } from "react-native";

export default function TabLayout() {
	return (
		<View className="flex-1" pointerEvents="box-none">
			<Tabs
				screenOptions={{
					animation: "none",
					headerShown: false,
					sceneStyle: { backgroundColor: "transparent" },
				}}
			>
				<Tabs.Screen name="index" options={{ title: "Inicio" }} />
				<Tabs.Screen
					name="guardar"
					options={{
						title: "Añadir",
						href: null,
						tabBarStyle: { display: "none" },
					}}
				/>
				<Tabs.Screen name="comprobantes" options={{ title: "Comprobantes" }} />
			</Tabs>
		</View>
	);
}
