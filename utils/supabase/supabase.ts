import "react-native-url-polyfill/auto";
import { createClient, processLock } from "@supabase/supabase-js";
import supabaseStorage from "./storage";
import { AppState, type AppStateStatus, Platform } from "react-native";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: supabaseStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state: AppStateStatus) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

import type {
  Session,
  User,
  AuthResponse,
  AuthTokenResponsePassword,
} from "@supabase/supabase-js";
export type { Session, User, AuthResponse, AuthTokenResponsePassword };
