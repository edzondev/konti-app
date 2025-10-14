import { supabase } from '@/utils/supabase/supabase';

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}
