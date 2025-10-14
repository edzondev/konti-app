import { usePurchases } from './use-purchases';
import { hasActiveEntitlement } from '@/services/purchases';

export function useActiveEntitlement(entitlementId?: string) {
  const { customerInfo } = usePurchases();

  return hasActiveEntitlement(customerInfo, entitlementId);
}
