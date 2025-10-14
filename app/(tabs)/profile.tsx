import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  HelpCircle,
  Lock,
  LogOut,
  Shield,
  User,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '@/components/providers/auth-provider';
import { useGetProfile } from '@/hooks/profile/use-profile';
import { useMemo } from 'react';

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

export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useGetProfile();

  const planConfig = useMemo(() => {
    return (
      PLAN_CONFIG[profile?.current_plan as keyof typeof PLAN_CONFIG] ??
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="font-regular text-lg text-primary">
          Cargando información...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="my-8 px-6">
        <View className="mt-4">
          <Text className="text-3xl font-semibold text-neutral-foreground">
            Perfil
          </Text>
        </View>

        <View className="py-8">
          {/* Información del usuario */}
          <View className="mb-8 flex-col items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <User size={32} color={COLORS.primary} />
            </View>
            <View className="flex-col items-center gap-2">
              <Text className="font-regular text-xl text-neutral-foreground">
                {profile?.name}
              </Text>
              <Text className="text-sm font-light text-muted-foreground">
                {profile?.email}
              </Text>
            </View>
          </View>

          {/* Sección General */}
          <View className="mb-8">
            <Text className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              General
            </Text>
            <View className="overflow-hidden rounded-lg border border-neutral-border bg-white">
              <Pressable
                onPress={() => router.push('/subscription')}
                className="w-full flex-row items-center justify-between border-y border-neutral-border px-4 py-6"
              >
                <View className="flex-row items-center gap-3">
                  <planConfig.icon.Component
                    size={20}
                    color={planConfig.icon.color}
                  />
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-light text-neutral-foreground">
                      Mi plan
                    </Text>
                    <Text className={planConfig.badge.className}>
                      {planConfig.badge.label}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>

              <Pressable className="w-full flex-row items-center justify-between px-4 py-6">
                <View className="flex-row items-center gap-3">
                  <Lock size={20} color={COLORS.muted.foreground} />
                  <Text className="text-sm font-light text-neutral-foreground">
                    Cambiar contraseña
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Sección Soporte */}
          <View className="mb-8">
            <Text className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Soporte
            </Text>
            <View className="overflow-hidden rounded-lg border border-neutral-border bg-white">
              <Pressable className="w-full flex-row items-center justify-between px-4 py-6">
                <View className="flex-row items-center gap-3">
                  <HelpCircle size={20} color={COLORS.muted.foreground} />
                  <Text className="text-sm font-light text-neutral-foreground">
                    ¿Necesitas ayuda?
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>

              <Pressable className="w-full flex-row items-center justify-between border-y border-neutral-border px-4 py-6">
                <View className="flex-row items-center gap-3">
                  <Shield size={20} color={COLORS.muted.foreground} />
                  <Text className="text-sm font-light text-neutral-foreground">
                    Política de privacidad
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Cerrar sesión */}
          <Pressable
            onPress={handleLogout}
            className="w-full flex-row items-center justify-center gap-3 rounded-lg bg-destructive/5 py-4 "
          >
            <LogOut size={20} color={COLORS.destructive} />
            <Text className="font-regular text-lg text-destructive">
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
