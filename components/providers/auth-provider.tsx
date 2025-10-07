import {
  Session,
  supabase,
  AuthResponse,
  AuthTokenResponsePassword,
} from "@/utils/supabase/supabase";

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthState = {
  isAuthenticated: boolean;
  session: Session | null;
  loading: boolean;
  isNewUser: boolean;
};

type SignInProps = {
  email: string;
  password: string;
};

type SignUpProps = {
  email: string;
  password: string;
  name?: string;
};

type AuthContextType = {
  signIn: (props: SignInProps) => Promise<AuthTokenResponsePassword>;
  signUp: (props: SignUpProps) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  clearNewUserFlag: () => void;
} & AuthState;

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return value;
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Configurar listener para cambios de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      switch (event) {
        case "SIGNED_OUT":
          setSession(null);
          break;
        case "INITIAL_SESSION":
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          setSession(newSession);
          break;
        default:
          break;
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInProps) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return result;
  }, []);

  const signUp = useCallback(async ({ email, password, name }: SignUpProps) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    // Mark as new user if signup was successful
    if (result.data.user && !result.error) {
      setIsNewUser(true);
    }

    return result;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const clearNewUserFlag = useCallback(() => {
    setIsNewUser(false);
  }, []);

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!session,
      session,
      loading,
      isNewUser,
      signIn,
      signUp,
      signOut,
      clearNewUserFlag,
    }),
    [session, loading, isNewUser, signIn, signUp, signOut, clearNewUserFlag],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
