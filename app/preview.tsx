import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Sparkles } from "@/constants/icons";
import { COLORS } from "@/constants/colors";
import ReceiptForm from "@/components/shared/forms/receipt-form";
import { useUserPlan } from "@/hooks/profile/use-user-plan";
import { useAiExtraction } from "@/hooks/receipts/use-ai-extraction";
import { Alert } from "react-native";
import { AiExtractedData } from "@/types/ai-extraction.types";
import { useState } from "react";

export default function Preview() {
  const { imageUrl } = useLocalSearchParams<{
    imageUrl: string;
  }>();
  const { hasProOrBetter } = useUserPlan();
  const { mutateAsync: extractData, isPending: isExtractingData } =
    useAiExtraction();
  const [extractedData, setExtractedData] = useState<
    AiExtractedData | undefined
  >();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isExtractingData) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [isExtractingData]);

  const handleAiExtraction = async () => {
    if (!imageUrl) return;

    try {
      const response = await extractData(imageUrl);
      if (response.success && response.data) {
        setExtractedData(response.data);
        Alert.alert(
          "Éxito",
          "Información extraída correctamente. El formulario se ha autocompletado.",
        );
      } else {
        Alert.alert("Error", "No se pudieron extraer los datos de la imagen");
      }
    } catch (error) {
      console.error("Error en extracción:", error);
      Alert.alert("Error", "No se pudo extraer la información de la imagen");
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-8">
          {imageUrl && (
            <View className="mb-8">
              <Image
                source={{ uri: imageUrl }}
                className="h-96 rounded-lg"
                resizeMode="cover"
              />
            </View>
          )}

          {hasProOrBetter && (
            <View className="mb-8">
              <Pressable
                onPress={handleAiExtraction}
                disabled={isExtractingData}
                className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-primary py-3  transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Animated.View style={animatedStyle}>
                  <Sparkles size={20} color={COLORS.primary} />
                </Animated.View>
                <Text className="font-geist-regular text-base text-primary">
                  {isExtractingData
                    ? "Extrayendo información..."
                    : "Extraer con IA"}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Formulario de Comprobante */}
          <ReceiptForm imageUrl={imageUrl} extractedData={extractedData} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
