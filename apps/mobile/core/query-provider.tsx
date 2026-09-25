import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { AppState, Platform } from "react-native";

if (Platform.OS !== "web") {
	focusManager.setEventListener((handleFocus) => {
		const subscription = AppState.addEventListener("change", (status) => {
			handleFocus(status === "active");
		});
		return () => subscription.remove();
	});
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 2,
		},
		mutations: {
			retry: 0,
		},
	},
});

export function QueryProvider({ children }: PropsWithChildren) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
