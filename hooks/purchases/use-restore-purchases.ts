import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { restorePurchases, formatPurchasesError } from "@/services/purchases";

export function useRestorePurchases() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: restorePurchases,
    onSuccess: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile.details,
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.purchases.data,
      });
    },
    onError: (error) => {
      const formattedError = formatPurchasesError(error);
      console.error("[Restore] Failed:", formattedError);
    },
  });

  return {
    restorePurchases: mutation.mutate,
    restorePurchasesAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
