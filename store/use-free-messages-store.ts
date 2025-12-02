import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '@/utils/storage/mmkv-storage';

const FREE_MESSAGES_LIMIT = 5;

interface FreeMessagesStore {
  messagesUsed: Record<string, number>;
  getMessagesUsed: (userId: string) => number;
  incrementMessage: (userId: string) => void;
  resetMessages: (userId: string) => void;
  hasReachedLimit: (userId: string) => boolean;
}

export const useFreeMessagesStore = create<FreeMessagesStore>()(
  persist(
    (set, get) => ({
      messagesUsed: {},
      getMessagesUsed: (userId: string) => {
        return get().messagesUsed[userId] ?? 0;
      },
      incrementMessage: (userId: string) => {
        set((state) => ({
          messagesUsed: {
            ...state.messagesUsed,
            [userId]: (state.messagesUsed[userId] ?? 0) + 1,
          },
        }));
      },
      resetMessages: (userId: string) => {
        set((state) => {
          const { [userId]: _, ...rest } = state.messagesUsed;
          return { messagesUsed: rest };
        });
      },
      hasReachedLimit: (userId: string) => {
        const used = get().getMessagesUsed(userId);
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
