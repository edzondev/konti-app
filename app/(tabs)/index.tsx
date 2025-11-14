import { View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import ReceiptListItem from '@/components/shared/receipt/receipt-list-item';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/components/providers/auth-provider';
import { SuccessModal } from '@/components/ui/success-modal';
import Empty from '@/components/shared/empty/empty';
import DashboardHeader from '@/components/shared/dashboard/header';
import { UploadModal } from '@/components/shared/modals/upload-modal';
import { useCameraPermission } from '@/hooks/camera/use-camera-permission';
import { useGalleryPicker } from '@/hooks/gallery/use-gallery-picker';
import { useHomeLogic } from '@/hooks/dashboard/use-home-logic';

export default function Index() {
  const { isNewUser, clearNewUserFlag } = useAuth();

  const { handleCameraPress } = useCameraPermission();
  const { handleGalleryPress, isUploading } = useGalleryPicker();
  const { receiptsData, isLoadingData, isRefetching, handleRefresh } =
    useHomeLogic();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 px-4">
        <DashboardHeader />
        {isLoadingData ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlashList
            data={receiptsData?.slice(0, 4) ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReceiptListItem receipt={item} />}
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListEmptyComponent={Empty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 200 }}
            onRefresh={handleRefresh}
            refreshing={isRefetching}
          />
        )}
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 100,
          right: 24,
          gap: 12,
        }}
      >
        <Pressable
          onPress={handleGalleryPress}
          disabled={isUploading}
          className="h-14 w-14 flex-row items-center justify-center rounded-2xl bg-secondary disabled:opacity-50"
          aria-label="Seleccionar imagen de galería"
        >
          <ImageIcon size={24} color="white" />
        </Pressable>

        <Pressable
          onPress={handleCameraPress}
          disabled={isUploading}
          className="h-16 w-16 flex-row items-center justify-center rounded-3xl bg-primary"
          aria-label="Tomar foto de nueva boleta"
        >
          <Camera size={28} color="white" />
        </Pressable>
      </View>

      <SuccessModal
        visible={isNewUser}
        onClose={clearNewUserFlag}
        title="¡Bienvenido a Konti!"
        message="Tu aliado para digitalizar recibos con IA ya está listo."
        buttonText="Empezar"
      />

      <UploadModal visible={isUploading} />
    </SafeAreaView>
  );
}
