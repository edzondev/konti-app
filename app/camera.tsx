import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, View, Alert, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, Zap, ZapOff } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';

export default function Camera() {
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [zoom, setZoom] = useState(0);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          router.push({
            pathname: '/photo-preview',
            params: { imageUri: photo.uri },
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert(
          'Error',
          'No se pudo capturar la foto. Intenta nuevamente.',
        );
      }
    }
  };

  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const handleZoomIn = () => {
    setZoom((current) => Math.min(current + 0.1, 1));
  };

  const handleZoomOut = () => {
    setZoom((current) => Math.max(current - 0.1, 0));
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="relative flex-1">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          flash={flash}
          enableTorch={flash === 'on' ? true : false}
          zoom={zoom}
        />

        {/* Camera controls at top right */}
        <View className="absolute right-6 top-6 gap-3">
          {/* Flash toggle */}
          <Pressable
            onPress={toggleFlash}
            className="h-14 w-14 items-center justify-center rounded-full bg-black/50 active:bg-black/70"
            aria-label="Toggle flash"
          >
            {flash === 'on' ? (
              <Zap size={22} color={COLORS.neutral.white} fill="white" />
            ) : (
              <ZapOff size={22} color={COLORS.neutral.white} />
            )}
          </Pressable>

          {/* Zoom controls */}
          <View className="flex-col items-center justify-center gap-2 overflow-hidden rounded-full bg-black/60">
            <Pressable
              onPress={handleZoomOut}
              disabled={zoom <= 0}
              className="h-14 w-14 items-center justify-center active:bg-white/10 disabled:opacity-40"
              aria-label="Zoom out"
            >
              <Minus size={22} color={COLORS.neutral.white} />
            </Pressable>

            <View className="h-14 w-14 items-center justify-center">
              <Text className="text-xs font-medium text-white">
                {(zoom * 10 + 1).toFixed(1)}x
              </Text>
            </View>

            <Pressable
              onPress={handleZoomIn}
              disabled={zoom >= 1}
              className="h-14 w-14 items-center justify-center active:bg-white/10 disabled:opacity-40"
              aria-label="Zoom in"
            >
              <Plus size={22} color={COLORS.neutral.white} />
            </Pressable>
          </View>
        </View>

        {/* Photo button at bottom */}
        <View className="absolute bottom-0 left-0 right-0 pb-14">
          <View className="items-center">
            <Pressable
              onPress={takePicture}
              aria-label="Capturar foto"
              className="items-center justify-center active:scale-95"
            >
              <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-white">
                <View className="h-16 w-16 rounded-full bg-white" />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
