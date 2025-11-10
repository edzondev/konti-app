import { createMMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

/**
 * Creates a Zustand-compatible storage adapter for MMKV
 * @param storageId - Unique identifier for the MMKV instance
 * @returns StateStorage adapter for Zustand persist middleware
 */
export const createMMKVStorage = (storageId: string): StateStorage => {
  const storage = createMMKV({
    id: storageId,
  });

  return {
    getItem: (name: string) => {
      const value = storage.getString(name);
      return value ?? null;
    },
    setItem: (name: string, value: string) => {
      storage.set(name, value);
    },
    removeItem: (name: string) => {
      storage.remove(name);
    },
  };
};
