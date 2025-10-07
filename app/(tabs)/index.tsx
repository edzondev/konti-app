import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "@/constants/icons";
import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { FlashList } from "@shopify/flash-list";
import ReceiptListItem from "@/components/shared/receipt/receipt-list-item";
import { COLORS } from "@/constants/colors";
import { useReceipts } from "@/hooks/receipts/use-receipts";

export default function Index() {
  const router = useRouter();
  const { data, isPending, isError, refetch, isLoading, error } = useReceipts();
  const [permission, requestPermission] = useCameraPermissions();

  const handleCameraPress = () => {
    if (permission && permission.granted) {
      router.push("/camera");
    } else {
      router.push("/camera-permission");
    }
  };

  if (isError || error) {
    return <Text>Error: {error as string}</Text>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="w-full flex-1 px-6 py-8">
        {isLoading || isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlashList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReceiptListItem receipt={item} />}
            refreshing={isLoading || isPending}
            onRefresh={refetch}
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListEmptyComponent={() => <Text>No hay comprobantes</Text>}
          />
        )}
      </View>

      <Pressable
        onPress={handleCameraPress}
        className="absolute bottom-6 right-6 h-16 w-16 flex-row items-center justify-center rounded-full bg-blue-500 active:scale-95"
        aria-label="Tomar foto de nueva boleta"
      >
        <Camera size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
