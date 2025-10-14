import { create } from 'zustand';

type FlashStore = {
  isFlashOn: boolean;
  handleFlashToggle: () => void;
  setFlashOff: () => void;
};

export const useFlashStore = create<FlashStore>((set) => ({
  isFlashOn: false,
  handleFlashToggle: () => set((state) => ({ isFlashOn: !state.isFlashOn })),
  setFlashOff: () => set({ isFlashOn: false }),
}));
