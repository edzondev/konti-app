import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const BACKOFF_MULTIPLIER = 1.5;

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY,
});

export function usePurchasesInitialize(): boolean {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!API_KEY) {
        console.error("[Purchases] Missing API key");
        return;
      }

      try {
        Purchases.configure({ apiKey: API_KEY });

        if (isMounted) {
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
  }, []);

  return isInitialized;
}
