import { Pressable, View } from 'react-native';
import { CameraView } from 'expo-camera';
import {
  Image as ImageIcon,
  X,
  Flashlight,
  FlashlightOff,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { useCameraControls } from '@/hooks/camera/use-camera-controls';
import { useGalleryPicker } from '@/hooks/gallery/use-gallery-picker';
import MainLayout from '@/components/layouts/main-layout';

export default function Camera() {
  const { cameraRef, flash, takePicture, toggleFlash, turnOffFlash } =
    useCameraControls();
  const { handleGalleryPress, isUploading } = useGalleryPicker();

  const handleClose = () => {
    turnOffFlash();
    router.back();
  };

  return (
    <MainLayout className="bg-black" edges={['top', 'bottom']}>
      <View className="relative flex-1">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          flash={flash}
          enableTorch={flash === 'on' ? true : false}
        />

        <View className="absolute left-0 right-0 top-0 px-6 pt-4">
          <Pressable
            onPress={handleClose}
            className="h-12 w-12 items-center justify-center rounded-full bg-black/50 active:bg-black/70"
            aria-label="Cerrar cámara"
          >
            <X size={22} color={COLORS.neutral.white} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View className="absolute inset-x-0 bottom-4">
          <View className="flex-row items-center justify-between px-8">
            <Pressable
              onPress={toggleFlash}
              className="h-14 w-14 items-center justify-center rounded-full bg-black/50 active:bg-black/70"
              aria-label="Toggle flash"
            >
              {flash === 'on' ? (
                <Flashlight
                  size={24}
                  color={COLORS.neutral.white}
                  strokeWidth={2}
                  fill="white"
                />
              ) : (
                <FlashlightOff
                  size={24}
                  color={COLORS.neutral.white}
                  strokeWidth={2}
                />
              )}
            </Pressable>

            <Pressable
              onPress={takePicture}
              disabled={isUploading}
              aria-label="Capturar foto"
              className="items-center justify-center active:scale-95 disabled:opacity-50"
            >
              <View className="h-20 w-20 items-center justify-center rounded-full border-[3px] border-white">
                <View className="h-[72px] w-[72px] rounded-full bg-white" />
              </View>
            </Pressable>

            <Pressable
              onPress={handleGalleryPress}
              disabled={isUploading}
              className="h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-black/50 active:bg-black/70 disabled:opacity-50"
              aria-label="Seleccionar imagen de galería"
            >
              <ImageIcon
                size={24}
                color={COLORS.neutral.white}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        </View>
      </View>
    </MainLayout>
  );
}
