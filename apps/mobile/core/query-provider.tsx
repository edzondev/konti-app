import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/core/auth-client";
import { ApiError } from "./api-error";

function QuerySessionLifecycle() {
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const previousUserId = useRef<string | undefined>(undefined);
	const userId = session?.user.id;

	useEffect(() => {
		if (previousUserId.current && !userId) {
			queryClient.clear();
		}

		previousUserId.current = userId;
	}, [queryClient, userId]);

	return null;
}

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

	return (
		<QueryClientProvider client={queryClient}>
			<QuerySessionLifecycle />
			{children}
		</QueryClientProvider>
	);
}
