import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { ApiError } from "./api-error";

export function QueryProvider({ children }: PropsWithChildren) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						retry: (failureCount, error) => {
							if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
								return false;
							}

							return failureCount < 2;
						},
						refetchOnMount: true,
						refetchOnReconnect: true,
					},
					mutations: {
						retry: 0,
					},
				},
			}),
	);

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
