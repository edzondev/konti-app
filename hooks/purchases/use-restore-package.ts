import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";
import { restorePurchases, formatPurchasesError } from "@/services/purchases";
import { usePurchasesStore } from "@/hooks/use-app-store";

export function useRestorePurchases() {
  const queryClient = useQueryClient();
  const setSubscriptionStatus = usePurchasesStore(
    (state) => state.setSubscriptionStatus,
  );

  const mutation = useMutation({
    mutationFn: restorePurchases,
    onSuccess: (customerInfo) => {
      queryClient.setQueryData(QUERY_KEYS.purchases.data, (old: any) => ({
        ...old,
        customerInfo,
      }));

      const hasActive =
        Object.keys(customerInfo.entitlements.active).length > 0;
      setSubscriptionStatus(hasActive);
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
