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

type Props = {
  isExtracting: boolean;
};

export default function Preview({ isExtracting }: Props) {
  const { imageUri } = useLocalSearchParams<{
    imageUri: string;
  }>();

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isExtracting) {
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
  }, [isExtracting]);

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
          {imageUri && (
            <View className="mb-8">
              <Image
                source={{ uri: imageUri }}
                className="h-96 rounded-lg"
                resizeMode="cover"
              />
            </View>
          )}

          <View className="mb-8">
            <Pressable
              onPress={() => {}}
              disabled={false}
              className="w-full flex-row items-center justify-center gap-2 rounded-lg border border-primary py-3  transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Animated.View style={animatedStyle}>
                <Sparkles size={20} color={COLORS.primary} />
              </Animated.View>
              <Text className="font-geist-regular text-base text-primary">
                {isExtracting ? "Extrayendo información..." : "Extraer con IA"}
              </Text>
            </Pressable>
          </View>

          {/* Formulario de Comprobante */}
          <ReceiptForm imageUri={imageUri} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
