import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import supabaseStorage from "./storage";
import { AppState, type AppStateStatus, Platform } from "react-native";
import type { Database } from "@/types/database.types";

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      ...(Platform.OS !== "web" ? { storage: supabaseStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  },
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
