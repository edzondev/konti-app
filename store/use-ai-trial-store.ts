import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '@/utils/storage/mmkv-storage';

interface AiTrialStore {
  hasUsedAiTrial: boolean;
  setHasUsedAiTrial: (value: boolean) => void;
  resetAiTrial: () => void;
}

export const useAiTrialStore = create<AiTrialStore>()(
  persist(
    (set) => ({
      hasUsedAiTrial: false,
      setHasUsedAiTrial: (value: boolean) => set({ hasUsedAiTrial: value }),
      resetAiTrial: () => set({ hasUsedAiTrial: false }),
    }),
    {
      name: 'ai-trial-storage',
      storage: createJSONStorage(() => createMMKVStorage('ai-trial-storage')),
    },
  ),
);
