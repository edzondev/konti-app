import { useMemo } from 'react';
import { COLORS } from '@/constants/colors';
import { Zap, Crown } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import type { Tables } from '@/types/database.types';

const PLAN_CONFIG = {
  free: {
    icon: { Component: Zap, color: COLORS.muted.foreground },
    badge: {
      label: 'Free',
      className:
        'bg-neutral-100 rounded px-2 py-0.5 text-xs font-light text-neutral-foreground',
    },
  },
  pro: {
    icon: { Component: Zap, color: COLORS.primary },
    badge: {
      label: 'Pro',
      className:
        'rounded bg-primary/10 px-2 py-0.5 text-xs font-light text-primary',
    },
  },
  premium: {
    icon: { Component: Crown, color: '#d97706' },
    badge: {
      label: 'Premium',
      className:
        'rounded bg-amber-500/10 px-2 py-0.5 text-xs font-light text-amber-600',
    },
  },
} as const;

type UseProfileComponentProps = {
  profile: Tables<'profiles'>;
  signOut: () => Promise<void>;
};

export default function useProfileComponent({
  profile,
  signOut,
}: UseProfileComponentProps) {
  const planConfig = useMemo(() => {
    return (
      PLAN_CONFIG[profile.current_plan as keyof typeof PLAN_CONFIG] ??
      PLAN_CONFIG.free
    );
  }, [profile.current_plan]);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de querer cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          onPress: async () => await signOut(),
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  const handlePrivacyPolicy = async () => {
    const url =
      'https://renedz21.github.io/konti-app.github.io/delete-account.html';
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Error',
        'No se puede abrir el enlace de la política de privacidad',
      );
    }
  };

  const handleHelp = async () => {
    const url =
      'https://renedz21.github.io/konti-app.github.io/delete-account.html';
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se puede abrir la página de ayuda');
    }
  };

  return {
    planConfig,
    handleLogout,
    handlePrivacyPolicy,
    handleHelp,
  };
}
