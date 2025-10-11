import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import Purchases, { CustomerInfo } from "react-native-purchases";

import { usePurchasesStore } from "@/hooks/use-app-store";

const PURCHASES_CONFIG_CHECK_INTERVAL_MS = 1000;

export function usePurchasesMonitor(): void {
  const setSubscriptionStatus = usePurchasesStore(
    (state) => state.setSubscriptionStatus,
  );
  const isConfiguredRef = useRef(false);

  useEffect(() => {
    let configCheckInterval: NodeJS.Timeout | null = null;
    let appStateSubscription: any = null;

    const checkSubscriptionStatus = async () => {
      try {
        const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
        const hasActiveSubscription =
          Object.keys(customerInfo.entitlements.active).length > 0;
        setSubscriptionStatus(hasActiveSubscription);
      } catch (error) {
        console.error("[PurchasesMonitor] Status check failed:", error);
      }
    };

    const setupMonitoring = () => {
      appStateSubscription = AppState.addEventListener(
        "change",
        (nextAppState: AppStateStatus) => {
          if (nextAppState === "active") {
            checkSubscriptionStatus();
          }
        },
      );

      Purchases.addCustomerInfoUpdateListener(checkSubscriptionStatus);
    };

    const waitForConfiguration = async () => {
      configCheckInterval = setInterval(async () => {
        if (isConfiguredRef.current) return;

        const configured = await Purchases.isConfigured();
        if (configured) {
          isConfiguredRef.current = true;
          clearInterval(configCheckInterval!);
          configCheckInterval = null;
          setupMonitoring();
        }
      }, PURCHASES_CONFIG_CHECK_INTERVAL_MS);
    };

    waitForConfiguration();

    return () => {
      if (configCheckInterval) clearInterval(configCheckInterval);
      if (appStateSubscription) appStateSubscription.remove();
    };
  }, [setSubscriptionStatus]);
}
