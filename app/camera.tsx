import { CameraView } from 'expo-camera';
import { Pressable, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, ZapOff } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { useCameraControls } from '@/hooks/camera/use-camera-controls';

export default function Camera() {
  const { cameraRef, flash, takePicture, toggleFlash } = useCameraControls();

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <View className="relative flex-1">
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          flash={flash}
          enableTorch={flash === 'on' ? true : false}
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
