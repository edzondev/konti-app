// hooks/app/useAppStateRefresh.ts
import { useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";

export function useAppStateRefresh() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.profile.details,
          });
        }
      },
    );

    return () => subscription.remove();
  }, [queryClient]);
}
