import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/constants/icons";
import { COLORS } from "@/constants/colors";
import ReceiptCard from "@/components/shared/receipt/receipt-card";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useReceiptDetails } from "@/hooks/receipts/use-receipts";
import type { Tables } from "@/types/database.types";

export default function RecipeDetails() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const { data, isPending, isError, isLoading } = useReceiptDetails(recipeId);

  if (isError) {
    return <Text>Error: {isError}</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="border-b border-neutral-border bg-white">
          <View className="flex-row items-center gap-4 px-6 py-4">
            <Pressable
              className="hover:bg-muted -ml-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
              aria-label="Volver"
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={COLORS.neutral.foreground} />
            </Pressable>
            <Text className="text-lg font-light text-neutral-foreground">
              Detalle de boleta
            </Text>
          </View>
        </View>

        {isLoading || isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ReceiptCard selectedReceipt={data as Tables<"receipts">} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
