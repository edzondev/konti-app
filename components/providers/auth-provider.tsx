import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Purchases from 'react-native-purchases';
import { useQueryClient } from '@tanstack/react-query';

import {
  Session,
  supabase,
  AuthResponse,
  AuthTokenResponsePassword,
} from '@/utils/supabase/supabase';

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
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return value;
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      switch (event) {
        case 'SIGNED_OUT':
          setSession(null);
          queryClient.clear();
          try {
            await Purchases.logOut();
          } catch (error) {
            console.error('RevenueCat logout error:', error);
          }
          break;
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          setSession(newSession);
          if (newSession?.user?.id) {
            try {
              await Purchases.logIn(newSession.user.id);
            } catch (error) {
              console.error('RevenueCat login error:', error);
            }
          }
          break;
        default:
          break;
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

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
