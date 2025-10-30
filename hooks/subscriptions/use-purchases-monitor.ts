import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Purchases from 'react-native-purchases';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuth } from '@/components/providers/auth-provider';

const PURCHASES_CONFIG_CHECK_INTERVAL_MS = 1000;

export function usePurchasesMonitor(): void {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const isConfiguredRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    let configCheckInterval: NodeJS.Timeout | null = null;
    let appStateSubscription: any = null;

    const refreshProfile = () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile.details(userId),
      });
    };

    const setupMonitoring = () => {
      appStateSubscription = AppState.addEventListener(
        'change',
        (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            refreshProfile();
          }
        },
      );

      // Escuchar actualizaciones de RevenueCat
      Purchases.addCustomerInfoUpdateListener(refreshProfile);
    };

    const waitForConfiguration = async () => {
      configCheckInterval = setInterval(async () => {
        if (isConfiguredRef.current) return;

        const configured = await Purchases.isConfigured();
        if (configured) {
          isConfiguredRef.current = true;
          clearInterval(configCheckInterval!);
          configCheckInterval = null;
          setupMonitoring();
        }
      }, PURCHASES_CONFIG_CHECK_INTERVAL_MS);
    };

    waitForConfiguration();

    return () => {
      if (configCheckInterval) clearInterval(configCheckInterval);
      if (appStateSubscription) appStateSubscription.remove();
    };
  }, [queryClient, userId]);
}
