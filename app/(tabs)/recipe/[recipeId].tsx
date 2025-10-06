import { View, Text, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "@/constants/icons";
import { COLORS } from "@/constants/colors";
import ReceiptCard from "@/components/shared/receipt/receipt-card";
import { useLocalSearchParams, useRouter } from "expo-router";

const selectedReceipt = {
  id: "001",
  date: "15 Mar 2025",
  amount: "S/ 1,250.00",
  isExpense: true,
  ruc: "20123456789",
  businessName: "Corporación Tech Solutions S.A.C.",
  receiptNumber: "F001-00001234",
  description: "Servicios de consultoría tecnológica",
  imageUrl: "https://picsum.photos/seed/696/3000/2000",
};

export default function RecipeDetails() {
  const { recipeId } = useLocalSearchParams<{ recipeId: string }>();
  const router = useRouter();

  console.log({ recipeId });
  return (
    <SafeAreaView className="flex-1 bg-white">
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

      <ReceiptCard selectedReceipt={selectedReceipt} />
    </SafeAreaView>
  );
}
