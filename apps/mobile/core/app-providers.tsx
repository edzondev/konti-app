import PostHog, { PostHogProvider } from "posthog-react-native";
import { type PropsWithChildren, type ReactNode, useState } from "react";
import { GestureHandlerRootView as GestureHandlerRootViewComponent } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { posthogClientConfig } from "./posthog-config";
import { setPostHogTracingClient } from "./posthog-identity";
import { QueryProvider } from "./query-provider";
import { ToastHost } from "./toast";

const GestureHandlerRootView = withUniwind(GestureHandlerRootViewComponent);

export function AppProviders({ children }: PropsWithChildren) {
	const app = (
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

	return <MaybePostHog>{app}</MaybePostHog>;
}

function MaybePostHog({ children }: { children: ReactNode }) {
	const [setup] = useState(() => {
		const config = posthogClientConfig();
		if (!config) return null;
		return {
			autocapture: config.autocapture,
			client: new PostHog(config.apiKey, config.options),
		};
	});

	setPostHogTracingClient(setup?.client ?? null);
	if (!setup) return children;

	return (
		<PostHogProvider autocapture={setup.autocapture} client={setup.client}>
			{children}
		</PostHogProvider>
	);
}
