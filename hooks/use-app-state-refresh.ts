import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuth } from '@/components/providers/auth-provider';

export function useAppStateRefresh() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.profile.details(userId),
          });
        }
      },
    );

    return () => subscription.remove();
  }, [queryClient, userId]);
}
