import { View, Text, Image, Pressable } from "react-native";
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
import { Sparkles, Check } from "@/constants/icons";
import { COLORS } from "@/constants/colors";
import { cn } from "@/lib/utils";

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

        {/* Formulario Futuro */}

        {/* Botones de Acción */}
        <View className="flex-row gap-x-4">
          <Pressable
            onPress={() => {}}
            className="flex-1 flex-row items-center justify-center rounded-lg bg-muted-foreground/10 py-3 text-neutral-foreground"
          >
            {({ pressed }) => (
              <Text
                className={cn(
                  "font-geist-regular text-muted-foreground",
                  pressed ? "text-neutral-foreground" : "",
                )}
              >
                Cancelar
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => {}}
            className="flex-1 rounded-lg bg-primary py-3 text-white"
          >
            {({ pressed }) => (
              <View
                className={cn(
                  "flex-row items-center justify-center gap-2",
                  pressed ? "opacity-70" : "",
                )}
              >
                <Check size={20} color={COLORS.neutral.white} />
                <Text className="font-geist-regular text-white">Guardar</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
