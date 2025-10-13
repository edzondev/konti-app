import { QUERY_KEYS } from "@/constants/query-keys";
import { formatPurchasesError, purchasePackage } from "@/services/purchases";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PurchasesPackage } from "react-native-purchases";

export function usePurchasePackage() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
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
