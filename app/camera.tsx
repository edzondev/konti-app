import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, View, Alert } from 'react-native';
import { X, Flashlight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';
import { useUploadImage } from '@/hooks/receipts/use-upload-image';
import { useFlashStore } from '@/store/use-flash-store';
import { UploadModal } from '@/components/shared/modals/upload-modal';

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { mutateAsync: uploadImage, isPending: isUploading } = useUploadImage();
  const { isFlashOn, handleFlashToggle } = useFlashStore();

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          // Subir imagen inmediatamente
          try {
            const imageUrl = await uploadImage(photo.uri);
            //const imageUrl = await uploadImage(photo.uri);
            router.push({
              pathname: '/preview',
              params: { imageUrl },
            });
          } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert(
              'Error',
              'No se pudo subir la imagen. Intenta nuevamente.',
            );
          }
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white ">
      <View className="relative flex-1">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          enableTorch={isFlashOn}
        />
        <View className="absolute bottom-8 left-0 right-0 flex justify-center">
          <Pressable
            onPress={takePicture}
            disabled={isUploading}
            aria-label="Capturar foto"
            className="items-center justify-center"
          >
            <View className="h-20 w-20 items-center justify-center rounded-full bg-white">
              <View className="h-16 w-16 rounded-full bg-primary" />
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="absolute left-6 top-6 flex h-14 w-14 items-center justify-center rounded-full bg-black/50"
          aria-label="Cancelar"
        >
          <X size={24} color={COLORS.neutral.white} />
        </Pressable>
        <Pressable
          onPress={handleFlashToggle}
          className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-full bg-black/50"
          aria-label="Toggle flash"
        >
          <Flashlight
            size={24}
            color={COLORS.neutral.white}
            fill={isFlashOn ? 'white' : 'transparent'}
          />
        </Pressable>
      </View>

      <UploadModal visible={isUploading} />
    </SafeAreaView>
  );
}
