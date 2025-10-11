import { create } from "zustand";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "purchases-storage" });

const SUBSCRIPTION_KEY = "hasActiveSubscription";

interface PurchasesStore {
  hasActiveSubscription: boolean;
  setSubscriptionStatus: (isActive: boolean) => void;
  hydrate: () => void;
}

export const usePurchasesStore = create<PurchasesStore>((set) => ({
  hasActiveSubscription: false,

  setSubscriptionStatus: (isActive: boolean) => {
    storage.set(SUBSCRIPTION_KEY, isActive);
    set({ hasActiveSubscription: isActive });
  },

  hydrate: () => {
    const stored = storage.getBoolean(SUBSCRIPTION_KEY);
    if (stored !== undefined) {
      set({ hasActiveSubscription: stored });
    }
  },
}));
