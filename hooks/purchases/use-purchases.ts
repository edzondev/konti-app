import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getPurchasesData } from '@/services/purchases';

export function usePurchases() {
  const { data, isPending, isError, isLoading, error, refetch, isRefetching } =
    useQuery({
      queryKey: QUERY_KEYS.purchases.data,
      queryFn: getPurchasesData,
      staleTime: 5 * 60 * 1000,
      retry: 2,
    });

  return {
    availablePackages: data?.packages ?? [],
    customerInfo: data?.customerInfo ?? null,
    isPending,
    isError,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
}
