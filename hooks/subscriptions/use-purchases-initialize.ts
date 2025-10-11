import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import type { CustomerInfo } from "react-native-purchases";

import { usePurchasesStore } from "@/hooks/use-app-store";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const BACKOFF_MULTIPLIER = 1.5;

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
});

export function usePurchasesInitialize(): boolean {
  const { setSubscriptionStatus, hydrate } = usePurchasesStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Hidratar estado persistido al inicio
    hydrate();

    const initialize = async () => {
      if (!API_KEY) {
        console.error("[Purchases] Missing API key");
        return;
      }

      try {
        Purchases.configure({ apiKey: API_KEY });
        const hasActiveSubscription = await verifySubscriptionStatus();

        if (isMounted) {
          setSubscriptionStatus(hasActiveSubscription);
          setIsInitialized(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error("[Purchases] Init failed:", error);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [setSubscriptionStatus, hydrate]);

  return isInitialized;
}

async function verifySubscriptionStatus(retryAttempt = 0): Promise<boolean> {
  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    if (retryAttempt >= MAX_RETRIES) throw error;

    const delay = RETRY_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, retryAttempt);
    await new Promise((resolve) => setTimeout(resolve, delay));

    return verifySubscriptionStatus(retryAttempt + 1);
  }
}
