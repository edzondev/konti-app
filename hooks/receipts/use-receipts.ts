import { QUERY_KEYS } from '@/constants/query-keys';
import {
  getReceipts,
  createReceipt,
  getReceiptDetails,
} from '@/services/receipts';
import type { Tables } from '@/types/database.types';
import { FiltersType } from '@/types/receipt.type';
import { useQueryBase } from '@/utils/query/hooks/query-base';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useReceipts(userId: string, filters: Partial<FiltersType>) {
  const queryClient = useQueryClient();
  const { data, ...rest } = useQueryBase<Tables<'receipts'>[]>({
    queryKey: [...QUERY_KEYS.receipts.all, filters],
    queryFn: () => getReceipts(userId, filters),
  });

  return {
    data,
    ...rest,
    refetch: async () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.receipts.all, filters],
      });
      return await queryClient.fetchQuery({
        queryKey: [...QUERY_KEYS.receipts.all, filters],
      });
    },
  };
}

function useReceiptDetails(id: string) {
  const { data, ...rest } = useQueryBase<Tables<'receipts'>>({
    queryKey: QUERY_KEYS.receipts.details(id),
    queryFn: () => getReceiptDetails(id),
    enabled: !!id,
  });
  return { data, ...rest };
}

function useCreateReceipt(imageUrl: string, userId: string) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending, isError } = useMutation({
    mutationFn: (data: any) => createReceipt(data, imageUrl, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.receipts.kpis, userId],
      });
    },
  });
  return { mutateAsync, isPending, isError };
}

export { useReceipts, useReceiptDetails, useCreateReceipt };
