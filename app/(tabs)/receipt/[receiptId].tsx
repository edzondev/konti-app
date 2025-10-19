import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import ReceiptCard from '@/components/shared/receipt/receipt-card';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReceiptDetails } from '@/hooks/receipts/use-receipts';
import type { Tables } from '@/types/database.types';

export default function ReceiptDetails() {
  const router = useRouter();
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { data, isPending, isError, isLoading } = useReceiptDetails(receiptId);

  if (isError) {
    return <Text>Error: {isError}</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white pt-6">
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable
              className="h-10 w-10 flex-row items-center justify-center rounded-full bg-gray-100"
              aria-label="Volver"
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={COLORS.neutral.foreground} />
            </Pressable>
            <Text className="text-2xl font-medium text-neutral-foreground">
              Detalle de boleta
            </Text>
            <View className="w-8" />
          </View>
        </View>

        {isLoading || isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <ReceiptCard selectedReceipt={data as Tables<'receipts'>} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
