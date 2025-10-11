import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PurchasesPackage } from "react-native-purchases";
import { QUERY_KEYS } from "@/constants/query-keys";
import { purchasePackage, formatPurchasesError } from "@/services/purchases";
import { usePurchasesStore } from "@/hooks/use-app-store";

export function usePurchasePackage() {
  const queryClient = useQueryClient();
  const setSubscriptionStatus = usePurchasesStore(
    (state) => state.setSubscriptionStatus,
  );

  const mutation = useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
    onSuccess: (customerInfo) => {
      // Actualizar cache de React Query
      queryClient.setQueryData(QUERY_KEYS.purchases.data, (old: any) => ({
        ...old,
        customerInfo,
      }));

      // Actualizar estado global
      const hasActive =
        Object.keys(customerInfo.entitlements.active).length > 0;
      setSubscriptionStatus(hasActive);
    },
    onError: (error) => {
      const formattedError = formatPurchasesError(error);
      console.error("[Purchase] Failed:", formattedError);
    },
  });

  return {
    purchasePackage: mutation.mutate,
    purchasePackageAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
