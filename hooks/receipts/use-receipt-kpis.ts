import { QUERY_KEYS } from "@/constants/query-keys";
import { getReceiptKpis } from "@/services/receipts";
import { ReceiptKpis } from "@/types/receipt.type";
import { useQueryBase } from "@/utils/query/hooks/query-base";

export function useReceiptKpis() {
  const { data, isPending, isError, refetch, isLoading, error, isRefetching } =
    useQueryBase<ReceiptKpis>({
      queryKey: QUERY_KEYS.receipts.kpis,
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
