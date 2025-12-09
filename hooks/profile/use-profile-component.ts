import { useMemo } from 'react';
import { COLORS } from '@/constants/colors';
import { Zap, Crown } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import type { Tables } from '@/types/database.types';

const PLAN_CONFIG = {
  free: {
    icon: { Component: Zap, color: COLORS.neutral.muted },
    badge: {
      label: 'Básico',
      className:
        'bg-neutral-100 rounded px-2 py-0.5 text-xs font-medium text-neutral-foreground',
    },
  },
  plus: {
    icon: { Component: Crown, color: COLORS.secondary.default },
    badge: {
      label: 'Plus',
      className:
        'rounded bg-secondary-default/10 px-2 py-0.5 text-xs font-medium text-secondary-default',
    },
  },
} as const;

type UseProfileComponentProps = {
  profile: Tables<'profiles'> | undefined;
  signOut: () => Promise<void>;
};

export default function useProfileComponent({
  profile,
  signOut,
}: UseProfileComponentProps) {
  const planConfig = useMemo(() => {
    if (!profile?.current_plan) {
      return PLAN_CONFIG.free;
    }
    return (
      PLAN_CONFIG[profile.current_plan as keyof typeof PLAN_CONFIG] ??
      PLAN_CONFIG.free
    );
  }, [profile?.current_plan]);

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
    const url = `${process.env.EXPO_PUBLIC_URL!}/terms`;
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
    const url = process.env.EXPO_PUBLIC_URL! as string;
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
