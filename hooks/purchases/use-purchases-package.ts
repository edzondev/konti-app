import { formatPurchasesError, purchasePackage } from '@/services/purchases';
import { useMutation } from '@tanstack/react-query';
import { PurchasesPackage } from 'react-native-purchases';

export function usePurchasePackage() {
  const { mutateAsync, ...rest } = useMutation({
    mutationFn: (pkg: PurchasesPackage) => purchasePackage(pkg),
    retry: false,
    onError: (error) => {
      const formattedError = formatPurchasesError(error);
      console.error('[Purchase] Failed:', formattedError);
    },
  });

  return {
    purchasePackageAsync: mutateAsync,
    ...rest,
  };
}
