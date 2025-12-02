import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import ReceiptCard from '@/components/shared/receipt/receipt-card';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useDeleteReceipt,
  useReceiptDetails,
} from '@/hooks/receipts/use-receipts';
import type { Tables } from '@/types/database.types';

export default function ReceiptDetails() {
  const router = useRouter();
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const { data, isPending, isError, isLoading } = useReceiptDetails(receiptId);
  const { mutateAsync: deleteReceipt, isPending: isDeleting } =
    useDeleteReceipt();

  const handleDeleteReceipt = async () => {
    Alert.alert(
      'Eliminar boleta',
      '¿Estás seguro de querer eliminar esta boleta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => await deleteReceipt(receiptId),
          style: 'destructive',
        },
      ],
    );
  };

  const handleShareReceipt = async () => {
    await Share.share({
      message: `${data?.image_url}`,
    });
  };

  if (isError) {
    return <Text>Error: {isError}</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-6" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-white pb-8 pt-6">
          <View className="flex-row items-center justify-between">
            <Pressable
              className="h-12 w-12 flex-row items-center justify-center rounded-full bg-gray-100"
              aria-label="Volver"
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={COLORS.neutral.foreground} />
            </Pressable>
            <Text className="text-2xl font-medium text-neutral-foreground">
              Detalle de boleta
            </Text>
            <Pressable
              className="h-12 w-12 flex-row items-center justify-center rounded-full bg-gray-100"
              aria-label="Compartir"
              onPress={() => handleShareReceipt()}
            >
              <Share2 size={24} color={COLORS.neutral.foreground} />
            </Pressable>
          </View>
        </View>

        {isLoading || isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary.default} />
          </View>
        ) : (
          <ReceiptCard
            selectedReceipt={data as Tables<'receipts'>}
            handleDeleteReceipt={handleDeleteReceipt}
            isDeleting={isDeleting}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
