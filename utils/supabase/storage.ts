import { SupportedStorage } from '@supabase/supabase-js';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
  id: 'supabase-storage',
  encryptionKey: 'my-encryption-key',
});

const supabaseStorage: SupportedStorage = {
  getItem: (key) => {
    return storage.getString(key) ?? null;
  },
  setItem: (key, value) => {
    storage.set(key, value);
  },
  removeItem(key) {
    storage.remove(key);
  },
};

export default supabaseStorage;
