import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { FileText, HelpCircle, LogOut, Shield } from 'lucide-react-native';
import { useAuth } from '@/components/providers/auth-provider';
import { useGetProfile } from '@/hooks/profile/use-profile';
import useProfileComponent from '@/hooks/profile/use-profile-component';
import type { Tables } from '@/types/database.types';
import { ProfileHeader } from '@/components/shared/profile/profile-header';
import { ProfileSection } from '@/components/shared/profile/profile-section';
import { ProfileMenuItem } from '@/components/shared/profile/profile-menu-item';

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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
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

        <ProfileHeader
          name={profile?.name ?? ''}
          email={profile?.email ?? ''}
        />

        <View className="">
          <ProfileSection title="General">
            <ProfileMenuItem
              icon={planConfig.icon.Component}
              iconColor={planConfig.icon.color}
              label="Mi plan"
              badge={planConfig.badge}
              onPress={() => router.push('/subscription')}
            />
          </ProfileSection>

          <ProfileSection title="Reportes">
            <ProfileMenuItem
              icon={FileText}
              iconColor={COLORS.primary}
              label="Reportes anuales"
              onPress={() => router.push('/reports')}
            />
          </ProfileSection>

          <ProfileSection title="Soporte">
            <ProfileMenuItem
              icon={HelpCircle}
              label="¿Necesitas ayuda?"
              onPress={handleHelp}
            />
            <View className="border-t border-neutral-border">
              <ProfileMenuItem
                icon={Shield}
                label="Política de privacidad"
                onPress={handlePrivacyPolicy}
              />
            </View>
          </ProfileSection>

          <Pressable
            onPress={handleLogout}
            className="w-full flex-row items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4"
          >
            <LogOut size={20} color={COLORS.destructive} />
            <Text className="text-lg text-destructive" numberOfLines={1}>
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
