import { SupportedStorage } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
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
    storage.delete(key);
  },
};

export default supabaseStorage;
