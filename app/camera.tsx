import { type CameraType, CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          router.push({
            pathname: "/preview",
            params: { imageUri: photo.uri },
          });
        }
      } catch (error) {
        console.error("Error taking picture:", error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="relative flex-1">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
        <View className="absolute bottom-8 left-0 right-0 flex justify-center">
          <Pressable
            onPress={takePicture}
            aria-label="Capturar foto"
            className="items-center justify-center"
          >
            <View className="h-20 w-20 rounded-full bg-white" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="absolute left-6 top-6 flex h-14 w-14 items-center justify-center rounded-full bg-black/50"
          aria-label="Cancelar"
        >
          <X size={24} color={COLORS.neutral.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
