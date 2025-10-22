import { View, Pressable, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import ImageComponent from '@/components/ui/image';
import { COLORS } from '@/constants/colors';
import { useUploadImage } from '@/hooks/receipts/use-upload-image';
import { UploadModal } from '@/components/shared/modals/upload-modal';

export default function PhotoPreview() {
  const { imageUri } = useLocalSearchParams<{
    imageUri: string;
  }>();
  const router = useRouter();
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();

  const handleContinue = async () => {
    if (!imageUri) return;

    try {
      const imageUrl = await uploadImage(imageUri);
      router.replace({
        pathname: '/preview',
        params: { imageUrl },
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta nuevamente.');
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <View className="relative flex-1">
        {/* Full screen image */}
        {imageUri && (
          <ImageComponent
            src={imageUri}
            contentFit="contain"
            alt="Foto capturada"
            style={{ width: '100%', height: '100%' }}
          />
        )}

        {/* Close button */}
        <Pressable
          onPress={handleClose}
          className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-black/70"
          aria-label="Volver a la cámara"
        >
          <X size={24} color={COLORS.neutral.white} />
        </Pressable>

        {/* Continue button */}
        <View className="absolute bottom-0 left-0 right-0 pb-12">
          <View className="items-center px-6">
            <Pressable
              onPress={handleContinue}
              disabled={isUploading}
              className="w-full rounded-full bg-white py-4 active:opacity-80 disabled:opacity-50"
              aria-label="Continuar"
            >
              <Text className="text-center text-base font-semibold text-black">
                Continuar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <UploadModal visible={isUploading} />
    </SafeAreaView>
  );
}
