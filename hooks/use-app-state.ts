import { focusManager } from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { AppState, Platform, type AppStateStatus } from "react-native";

export default function useAppState() {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (Platform.OS !== "web") {
          focusManager.setFocused(status === "active");
        }
      },
    );

    return () => subscription.remove();
  }, []);
}
