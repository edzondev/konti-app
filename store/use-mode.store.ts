import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKVStorage } from '@/utils/storage/mmkv-storage';
import { colorScheme } from 'nativewind';

type Mode = 'light' | 'dark';

type ModeStore = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  handleModeToggle: () => void;
};

export const useModeStore = create<ModeStore>()(
  persist(
    (set) => ({
      mode: 'light',
      setMode: (mode: Mode) => set({ mode }),
      handleModeToggle: () =>
        set((state) => ({
          mode: state.mode === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'mode-storage',
      storage: createJSONStorage(() => createMMKVStorage('mode-storage')),
    },
  ),
);
