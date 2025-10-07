import { View, Text, Pressable, Image, Alert, Linking } from "react-native";
import { useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();
  const [_, requestPermission] = useCameraPermissions();

  async function handlePermissions() {
    const result = await requestPermission();

    if (result.granted) {
      router.dismissTo("(tabs)");
      return;
    }

    Alert.alert(
      "Permiso de cámara requerido",
      "Necesitamos acceso a tu cámara para escanear boletas y tomar fotos.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Ir a configuración", onPress: () => Linking.openSettings() },
      ],
    );
  }

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
        <Text className="mb-4 font-geist-semibold text-3xl text-gray-900">
          Bienvenido a KONTI
        </Text>

        {/* Description */}
        <Text className="mb-10 px-4 text-center font-geist-regular text-base leading-6 text-gray-500">
          Escanea y guarda tus boletas de forma segura.
        </Text>

        {/* Button */}
        <Pressable
          onPress={handlePermissions}
          className="w-full max-w-sm items-center rounded-full bg-primary px-8 py-4 active:opacity-80"
        >
          <Text className="font-geist-semibold text-base text-white">
            Acceder a la cámara
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
