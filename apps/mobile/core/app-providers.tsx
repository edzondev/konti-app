import type { PropsWithChildren } from "react";
import { GestureHandlerRootView as GestureHandlerRootViewComponent } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { withUniwind } from "uniwind";
import { QueryProvider } from "./query-provider";

const GestureHandlerRootView = withUniwind(GestureHandlerRootViewComponent);

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<GestureHandlerRootView className="flex-1">
			<KeyboardProvider preload={false}>
				<QueryProvider>{children}</QueryProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
