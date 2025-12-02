import { QUERY_KEYS } from '@/constants/query-keys';
import { getProfile } from '@/services/profile';

import type { Tables } from '@/types/database.types';
import { useQueryBase } from '@/utils/query/hooks/query-base';
import { useAuth } from '@/components/providers/auth-provider';

function useGetProfile() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const { data, ...rest } = useQueryBase<Tables<'profiles'>>({
    queryKey: QUERY_KEYS.profile.details(userId),
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });
  return { data, ...rest };
}

export { useGetProfile };
