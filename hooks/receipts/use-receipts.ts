import { QUERY_KEYS } from '@/constants/query-keys';
import {
  getReceipts,
  createReceipt,
  getReceiptDetails,
  deleteReceipt,
} from '@/services/receipts';
import type { Tables } from '@/types/database.types';
import { FiltersType } from '@/types/receipt.type';
import { useQueryBase } from '@/utils/query/hooks/query-base';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'expo-router';

function useReceipts(filters: Partial<FiltersType>) {
  const { session } = useAuth();
  const userId = session?.user.id || '';
  const queryClient = useQueryClient();
  const { data, ...rest } = useQueryBase<Tables<'receipts'>[]>({
    queryKey: [...QUERY_KEYS.receipts.all(userId), filters],
    queryFn: () => getReceipts(userId, filters),
  });

  return {
    data,
    ...rest,
    refetch: async () => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.receipts.all(userId), filters],
      });
      return await queryClient.fetchQuery({
        queryKey: [...QUERY_KEYS.receipts.all(userId), filters],
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
        queryKey: QUERY_KEYS.receipts.kpis(userId),
      });
    },
  });
  return { mutateAsync, isPending, isError };
}

function useDeleteReceipt() {
  const { session } = useAuth();
  const userId = session?.user.id || '';
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync, isPending, isError } = useMutation({
    mutationFn: (id: string) => deleteReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.receipts.all(userId) });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.receipts.kpis(userId),
      });
      router.back();
    },
  });
  return { mutateAsync, isPending, isError };
}

export { useReceipts, useReceiptDetails, useCreateReceipt, useDeleteReceipt };
