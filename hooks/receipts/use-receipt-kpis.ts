import { QUERY_KEYS } from '@/constants/query-keys';
import { getReceiptKpis } from '@/services/receipts';
import { useQueryBase } from '@/utils/query/hooks/query-base';

export function useReceiptKpis() {
  const { data, isPending, isError, refetch, isLoading, error, isRefetching } =
    useQueryBase({
      queryKey: [QUERY_KEYS.receipts.kpis],
      queryFn: () => getReceiptKpis(),
    });

  return {
    data,
    isPending,
    isError,
    refetch,
    isLoading,
    error,
    isRefetching,
  };
}
