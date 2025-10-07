import { QUERY_KEYS } from "@/constants/query-keys";
import { getSessionProfile } from "@/services/profile";

import type { Tables } from "@/types/database.types";
import { useQueryBase } from "@/utils/query/hooks/query-base";
import { useAuth } from "@/components/providers/auth-provider";

function useGetProfile() {
  const { session } = useAuth();

  const { data, isPending, isError, isLoading, error, refetch, isRefetching } =
    useQueryBase({
      queryKey: QUERY_KEYS.profile.details,
      queryFn: () => getSessionProfile(),
      enabled: !!session?.user.id,
    });
  return { data, isPending, isError, isLoading, error, refetch, isRefetching };
}

export { useGetProfile };
