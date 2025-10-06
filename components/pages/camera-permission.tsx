import { View, Text, Pressable, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CameraPermissionProps {
  onRequestPermission: () => void;
  canAskAgain: boolean;
}

export default function CameraPermission({
  onRequestPermission,
  canAskAgain,
}: CameraPermissionProps) {
  const handlePress = () => {
    if (canAskAgain) {
      onRequestPermission();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        {/* Image */}
        <View className="mb-8">
          <Image
            source={require("@/assets/images/photo.png")}
            resizeMode="contain"
            style={{ width: 300, height: 300 }}
          />
        </View>

        {/* Title */}
        <Text className="mb-4 font-geist-bold text-2xl text-gray-900">
          Acceder a la cámara
        </Text>

        {/* Description */}
        <Text className="mb-10 px-4 text-center font-geist-regular text-base leading-6 text-gray-500">
          {canAskAgain
            ? "Acceder a la cámara para capturar y subir tus recibos fácilmente"
            : "Permiso de cámara denegado. Por favor, accede a los ajustes de tu dispositivo para capturar recibos"}
        </Text>

        {/* Button */}
        <Pressable
          onPress={handlePress}
          className="w-full max-w-sm items-center rounded-full bg-primary px-8 py-4 active:opacity-80"
        >
          <Text className="font-geist-semibold text-base text-white">
            {canAskAgain ? "Acceder a la cámara" : "Ir a ajustes"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
