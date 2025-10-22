import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  HelpCircle,
  LogOut,
  Shield,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/components/providers/auth-provider';
import { useGetProfile } from '@/hooks/profile/use-profile';
import useProfileComponent from '@/hooks/profile/use-profile-component';
import type { Tables } from '@/types/database.types';

export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: profile, isLoading } = useGetProfile();
  const { planConfig, handleLogout, handlePrivacyPolicy, handleHelp } =
    useProfileComponent({
      profile: profile as Tables<'profiles'>,
      signOut: async () => await signOut(),
    });

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-lg font-semibold text-primary" numberOfLines={1}>
          Cargando información...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-4">
        <View className="my-8">
          <Text
            className="text-3xl font-bold text-neutral-foreground"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Mi Perfil
          </Text>
        </View>

        <View className="py-8">
          {/* Información del usuario */}
          <View className="mb-8 flex-col items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <User size={32} color={COLORS.primary} />
            </View>
            <View className="flex-col items-center justify-center gap-2">
              <Text
                className="font-regular text-center text-xl text-neutral-foreground"
                numberOfLines={1}
              >
                {profile?.name}
              </Text>
              <Text
                className="text-sm font-normal text-muted-foreground"
                numberOfLines={1}
              >
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
                    <Text
                      className="text-sm font-normal text-neutral-foreground"
                      numberOfLines={1}
                    >
                      Mi plan
                    </Text>
                    <Text
                      className={planConfig.badge.className}
                      numberOfLines={1}
                    >
                      {planConfig.badge.label}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>
              {/* Sección Soporte (deshabilitada por ahora)

              <Pressable className="w-full flex-row items-center justify-between px-4 py-6">
                <View className="flex-row items-center gap-3">
                  <Lock size={20} color={COLORS.muted.foreground} />
                  <Text className="text-sm font-light text-neutral-foreground">
                    Cambiar contraseña
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>
              */}
            </View>
          </View>

          {/* Sección Soporte */}
          <View className="mb-8">
            <Text className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Soporte
            </Text>
            <View className="overflow-hidden rounded-lg border border-neutral-border bg-white">
              <Pressable
                onPress={handleHelp}
                className="w-full flex-row items-center justify-between px-4 py-6"
              >
                <View className="flex-row items-center gap-3">
                  <HelpCircle size={20} color={COLORS.muted.foreground} />
                  <Text
                    className="text-sm font-normal text-neutral-foreground"
                    numberOfLines={1}
                  >
                    ¿Necesitas ayuda?
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>

              <Pressable
                onPress={handlePrivacyPolicy}
                className="w-full flex-row items-center justify-between border-y border-neutral-border px-4 py-6"
              >
                <View className="flex-row items-center gap-3">
                  <Shield size={20} color={COLORS.muted.foreground} />
                  <Text
                    className="text-sm font-normal text-neutral-foreground"
                    numberOfLines={1}
                  >
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
            <Text
              className="text-lg font-semibold text-destructive"
              numberOfLines={1}
            >
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
