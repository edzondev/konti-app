import Purchases, { PURCHASES_ERROR_CODE } from 'react-native-purchases';

import type {
  CustomerInfo,
  PurchasesPackage,
  PurchasesError,
} from 'react-native-purchases';

export interface PurchasesHookError {
  message: string;
  code?: string;
}

export const NOT_INITIALIZED_ERROR: PurchasesHookError = {
  message: 'Purchases SDK is not initialized.',
  code: 'NOT_INITIALIZED',
};

function isPurchasesError(error: unknown): error is PurchasesError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function formatPurchasesError(err: unknown): PurchasesHookError {
  if (isPurchasesError(err)) {
    if (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { message: 'Purchase cancelled', code: 'CANCELLED' };
    }
    return { message: err.message, code: String(err.code) };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: String(err) };
}

export async function checkPurchasesConfiguration(): Promise<boolean> {
  const isConfigured = await Purchases.isConfigured();
  if (!isConfigured) {
    throw NOT_INITIALIZED_ERROR;
  }
  return true;
}

export interface PurchasesData {
  packages: readonly PurchasesPackage[];
  customerInfo: CustomerInfo;
}

export async function getPurchasesData(): Promise<PurchasesData> {
  await checkPurchasesConfiguration();

  const [offerings, customerInfo] = await Promise.all([
    Purchases.getOfferings(),
    Purchases.getCustomerInfo(),
  ]);

  return {
    packages: offerings.current?.availablePackages ?? [],
    customerInfo,
  };
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<CustomerInfo> {
  await checkPurchasesConfiguration();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  await checkPurchasesConfiguration();
  return await Purchases.restorePurchases();
}

export function hasActiveEntitlement(
  customerInfo: CustomerInfo | null | undefined,
  entitlementId?: string,
): boolean {
  if (!customerInfo?.entitlements?.active) return false;

  const activeEntitlements = customerInfo.entitlements.active;

  if (!entitlementId) {
    return Object.keys(activeEntitlements).length > 0;
  }

  return entitlementId in activeEntitlements;
}
