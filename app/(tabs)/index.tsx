import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "@/constants/icons";
import { useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { FlashList } from "@shopify/flash-list";
import ReceiptListItem from "@/components/shared/receipt/receipt-list-item";
import { COLORS } from "@/constants/colors";
import { useReceipts } from "@/hooks/receipts/use-receipts";
import { useAuth } from "@/components/providers/auth-provider";
import { SuccessModal } from "@/components/ui/success-modal";
import Empty from "@/components/shared/empty/empty";
import { useCallback } from "react";
import DashboardHeader from "@/components/shared/dashboard/header";
import { useReceiptKpis } from "@/hooks/receipts/use-receipt-kpis";

export default function Index() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { data, isPending, isError, refetch, isLoading, error } = useReceipts(
    {},
  );
  const { refetch: refetchKpis, isRefetching } = useReceiptKpis();

  const { isNewUser, clearNewUserFlag } = useAuth();

  const handleCameraPress = useCallback(async () => {
    if (permission && permission.granted) {
      router.push("/camera");
    } else {
      const result = await requestPermission();
      if (result.granted) {
        router.push("/camera");
      }
    }
  }, [permission, requestPermission, router]);

  const handleWelcomeModalClose = () => {
    clearNewUserFlag();
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
            data={data?.slice(0, 3) ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReceiptListItem receipt={item} />}
            refreshing={isLoading || isPending || isRefetching}
            onRefresh={() => {
              refetchKpis();
              refetch();
            }}
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListEmptyComponent={() => <Empty />}
            ListHeaderComponent={() => <DashboardHeader data={data ?? []} />}
            showsVerticalScrollIndicator={false}
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

      {isNewUser && (
        <SuccessModal
          visible={isNewUser}
          onClose={handleWelcomeModalClose}
          title="¡Bienvenido!"
          message="Tu cuenta ha sido creada exitosamente. Ya puedes comenzar a subir tus boletas y organizar tus comprobantes."
          buttonText="Empezar"
        />
      )}
    </SafeAreaView>
  );
}
