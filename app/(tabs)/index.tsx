import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { FlashList } from '@shopify/flash-list';
import ReceiptListItem from '@/components/shared/receipt/receipt-list-item';
import { COLORS } from '@/constants/colors';
import { useReceipts } from '@/hooks/receipts/use-receipts';
import { useAuth } from '@/components/providers/auth-provider';
import { SuccessModal } from '@/components/ui/success-modal';
import Empty from '@/components/shared/empty/empty';
import { useCallback } from 'react';
import DashboardHeader from '@/components/shared/dashboard/header';
import { useReceiptKpis } from '@/hooks/receipts/use-receipt-kpis';

export default function Index() {
  const { isNewUser, clearNewUserFlag } = useAuth();
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { data, isPending, isLoading, error, refetch, isRefetching } =
    useReceipts({});
  const { refetch: refetchKpis } = useReceiptKpis();

  const handleCameraPress = useCallback(async () => {
    if (permission && permission.granted) {
      router.push('/camera');
    } else {
      const result = await requestPermission();
      if (result.granted) {
        router.push('/camera');
      }
    }
  }, [permission, requestPermission, router]);

  const handleWelcomeModalClose = () => {
    clearNewUserFlag();
  };

  if (error) {
    return <Text>Error: {error as string}</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-4">
        <DashboardHeader data={data ?? []} />
        {isLoading || isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlashList
            data={data?.slice(0, 4) ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReceiptListItem receipt={item} />}
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListEmptyComponent={() => <Empty />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            onRefresh={() => {
              return Promise.all([refetchKpis(), refetch()]);
            }}
            refreshing={isRefetching}
          />
        )}
      </View>

      <Pressable
        onPress={handleCameraPress}
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 40) + 60 + 20, // tab bar height + margin + extra space
          right: 24,
        }}
        className="h-16 w-16 flex-row items-center justify-center rounded-3xl bg-primary"
        aria-label="Tomar foto de nueva boleta"
      >
        <Camera size={28} color="white" />
      </Pressable>

      {isNewUser && (
        <SuccessModal
          visible={isNewUser}
          onClose={handleWelcomeModalClose}
          title="¡Bienvenido!"
          message="Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a subir tus boletas y organizar tus comprobantes."
          buttonText="Empezar"
        />
      )}
    </SafeAreaView>
  );
}
