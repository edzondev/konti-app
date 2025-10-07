import { supabase } from "@/utils/supabase/supabase";

export async function getSessionProfile() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (!session) return null;

  const user = session.user;
  const profile = user.user_metadata;

  return {
    id: user.id,
    email: user.email,
    name: profile?.name,
    avatar_url: profile?.avatar_url,
    current_plan: profile?.current_plan,
  };
}
