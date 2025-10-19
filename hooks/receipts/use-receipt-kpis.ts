import { QUERY_KEYS } from '@/constants/query-keys';
import { getReceiptKpis } from '@/services/receipts';
import { useQueryBase } from '@/utils/query/hooks/query-base';

export function useReceiptKpis(userId: string) {
  const { data, ...rest } = useQueryBase({
    queryKey: [...QUERY_KEYS.receipts.kpis, userId],
    queryFn: () => getReceiptKpis(userId),
  });

  return {
    data,
    ...rest,
  };
}
