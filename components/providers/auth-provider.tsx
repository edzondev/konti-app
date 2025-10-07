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

    return result;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("SignOut error:", error);
    }
  }, []);

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(
    () => ({
      isAuthenticated: !!session,
      session,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, signIn, signUp, signOut],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
