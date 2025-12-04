import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '@/utils/storage/mmkv-storage';

const FREE_MESSAGES_LIMIT = 5;

interface FreeMessagesStore {
  messagesUsed: number;
  getMessagesUsed: () => number;
  incrementMessage: () => void;
  resetMessages: () => void;
  hasReachedLimit: () => boolean;
}

export const useFreeMessagesStore = create<FreeMessagesStore>()(
  persist(
    (set, get) => ({
      messagesUsed: 0,
      getMessagesUsed: () => {
        return get().messagesUsed;
      },
      incrementMessage: () => {
        set((state) => ({
          messagesUsed: state.messagesUsed + 1,
        }));
      },
      resetMessages: () => {
        set({ messagesUsed: 0 });
      },
      hasReachedLimit: () => {
        const used = get().getMessagesUsed();
        return used >= FREE_MESSAGES_LIMIT;
      },
    }),
    {
      name: 'free-messages-storage',
      storage: createJSONStorage(() =>
        createMMKVStorage('free-messages-storage'),
      ),
    },
  ),
);
