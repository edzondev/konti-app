import { useCallback } from 'react';
import { useReceipts } from '@/hooks/receipts/use-receipts';
import { useReceiptKpis } from '@/hooks/receipts/use-receipt-kpis';

export function useHomeLogic() {
  const { data, isPending, isLoading, refetch, isRefetching } = useReceipts({});
  const { refetch: refetchKpis } = useReceiptKpis();

  const handleRefresh = useCallback(() => {
    return Promise.all([refetchKpis(), refetch()]);
  }, [refetchKpis, refetch]);

  const isLoadingData = isLoading || isPending;

  return {
    receiptsData: data,
    isLoadingData,
    isRefetching,
    handleRefresh,
  };
}
