import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren } from 'react';
import useAppState from '@/hooks/use-app-state';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnReconnect: true,
      refetchOnMount: false,
      networkMode: 'online',
    },
    mutations: {
      retry: 2,
      networkMode: 'online',
    },
  },
});

if (__DEV__) {
  queryClient.setDefaultOptions({
    queries: {
      ...queryClient.getDefaultOptions().queries,
      staleTime: 1000 * 30,
    },
  });
}

export default function QueryProvider({ children }: PropsWithChildren) {
  useAppState();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
