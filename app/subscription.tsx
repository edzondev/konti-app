import { useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { X } from "lucide-react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import PlanCard from "@/components/shared/suscription/plan-card";
import { usePurchases } from "@/hooks/purchases/use-purchases";
import { usePurchasePackage } from "@/hooks/purchases/use-purchases-package";
import type { PurchasesPackage } from "react-native-purchases";
import { FlashList } from "@shopify/flash-list";

const featureMap = {
  pro: [
    "Hasta 500 boletas por mes",
    "Acceso a IA base para lectura y análisis.",
    "Sin límites de uso diario.",
    "Soporte estándar.",
  ],
  premium: [
    "Subidas ilimitadas",
    "Acceso a IA avanzada.",
    "Procesamiento más rápido",
    "Acceso anticipado a nuevas funciones",
    "Soporte prioritario 24/7",
  ],
};

export default function SubscriptionScreen() {
  const { availablePackages, isLoading, refetch, isRefetching } =
    usePurchases();
  const { purchasePackage, isPending: isPurchasing } = usePurchasePackage();

  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleClose = () => {
    router.back();
  };

  const handlePlanSelect = (plan: PurchasesPackage) => {
    purchasePackage(plan);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color={COLORS.primary} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 px-6">
        <Animated.View style={[contentAnimatedStyle]} className="flex-1">
          <FlashList
            data={availablePackages}
            keyExtractor={(item) => item.identifier}
            renderItem={({ item }) => (
              <PlanCard
                plan={item}
                features={
                  featureMap[item.identifier as keyof typeof featureMap]
                }
                isPopular={item.product.title.includes("Pro")}
                onSelect={handlePlanSelect}
                isLoading={isPurchasing}
              />
            )}
            onRefresh={() => refetch()}
            refreshing={isRefetching}
            ListHeaderComponent={() => (
              <View className="py-8">
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity onPress={handleClose} className="p-2">
                    <X size={24} color={COLORS.neutral.foreground} />
                  </TouchableOpacity>
                  <Text className="text-xl font-semibold text-neutral-foreground">
                    Planes de suscripción
                  </Text>
                  <View className="w-6" />
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
