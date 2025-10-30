import { useAuth } from '@/components/providers/auth-provider';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getReceiptKpis } from '@/services/receipts';
import { useQueryBase } from '@/utils/query/hooks/query-base';

export function useReceiptKpis() {
  const { session } = useAuth();
  const userId = session?.user.id;

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  const { data, ...rest } = useQueryBase({
    queryKey: QUERY_KEYS.receipts.kpis(userId),
    queryFn: () => getReceiptKpis(userId),
  });

  return {
    data,
    ...rest,
  };
}
