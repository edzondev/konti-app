import { QUERY_KEYS } from "@/constants/query-keys";
import {
  getReceipts,
  createReceipt,
  getReceiptDetails,
} from "@/services/receipts";
import type { Tables } from "@/types/database.types";
import { FiltersType } from "@/types/receipt.type";
import { useQueryBase } from "@/utils/query/hooks/query-base";
import { useMutation } from "@tanstack/react-query";

function useReceipts(filters: Partial<FiltersType>) {
  const { data, isPending, isError, refetch, isLoading, error } = useQueryBase<
    Tables<"receipts">[]
  >({
    queryKey: [...QUERY_KEYS.receipts.all, filters],
    queryFn: () => getReceipts(filters),
  });
  return { data, isPending, isError, refetch, isLoading, error };
}

function useReceiptDetails(id: string) {
  const { data, isPending, isError, refetch, isLoading } = useQueryBase<
    Tables<"receipts">
  >({
    queryKey: QUERY_KEYS.receipts.details(id),
    queryFn: () => getReceiptDetails(id),
    enabled: !!id,
  });
  return { data, isPending, isError, refetch, isLoading };
}

function useCreateReceipt(imageUrl: string, userId: string) {
  const { mutateAsync, isPending, isError } = useMutation({
    mutationFn: (data: any) => createReceipt(data, imageUrl, userId),
  });
  return { mutateAsync, isPending, isError };
}

export { useReceipts, useReceiptDetails, useCreateReceipt };
