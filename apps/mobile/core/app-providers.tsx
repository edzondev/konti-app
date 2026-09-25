import type { PropsWithChildren } from "react";
import { GestureHandlerRootView as GestureHandlerRootViewComponent } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { QueryProvider } from "./query-provider";
import { ToastHost } from "./toast";

const GestureHandlerRootView = withUniwind(GestureHandlerRootViewComponent);

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics}>
			<GestureHandlerRootView className="flex-1">
				<KeyboardProvider preload={false}>
					<QueryProvider>
						{children}
						<ToastHost />
					</QueryProvider>
				</KeyboardProvider>
			</GestureHandlerRootView>
		</SafeAreaProvider>
	);
}
