import { QUERY_KEYS } from "@/constants/query-keys";
import getReceipts, {
  createReceipt,
  getReceiptDetails,
} from "@/services/receipts";
import type { TablesInsert, Tables } from "@/types/database.types";
import { useMutationBase, useQueryBase } from "@/utils/query/hooks/query-base";
import { useMutation } from "@tanstack/react-query";

function useReceipts() {
  const { data, isPending, isError, refetch, isLoading, error } = useQueryBase<
    Tables<"receipts">[]
  >({
    queryKey: QUERY_KEYS.receipts.all,
    queryFn: getReceipts,
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

function useCreateReceipt() {
  const { mutateAsync, isPending, isError } = useMutation({
    mutationFn: createReceipt,
  });
  return { mutateAsync, isPending, isError };
}

export { useReceipts, useReceiptDetails, useCreateReceipt };
