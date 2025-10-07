import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Crown, ArrowLeft, Zap } from "lucide-react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import PlanCard from "@/components/shared/suscription/plan-card";
import { Plan } from "@/types/plan.type";

const plans: Plan[] = [
  {
    id: "pro",
    name: "Plan Pro",
    price: "$29.99",
    isPopular: true,
    description: "Automatiza y analiza tus boletas.",
    features: [
      "Hasta 500 boletas por mes",
      "Acceso a IA base para lectura y analizar sus boletas",
      "Sin límites de uso diario.",
    ],
    icon: Zap,
    badgeColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  {
    id: "premium",
    name: "Plan Premium",
    price: "$49.99",
    description: "Accede a todas las funciones del plan Pro y más.",
    features: [
      "Subidas ilimitadas",
      "IA avanzada (modelo superior con más contexto)",
      "Procesamiento más rápido",
      "Acceso anticipado a nuevas funciones",
      "Soporte prioritario 24/7",
    ],
    icon: Crown,
    badgeColor: "#ff9c00",
    borderColor: COLORS.neutral.border,
  },
];

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");

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

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = () => {
    const selectedPlanData = plans.find((p) => p.id === selectedPlan);
    console.log("Selected plan:", selectedPlanData);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={handleClose} className="-ml-2 p-2">
            <ArrowLeft size={24} color={COLORS.neutral.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-neutral-foreground">
            Planes de suscripción
          </Text>
          <View className="w-8" />
        </View>
      </View>

      <Animated.View style={[contentAnimatedStyle]} className="flex-1">
        <ScrollView
          className="px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 16 }}
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selectedPlan={selectedPlan}
              handlePlanSelect={handlePlanSelect}
            />
          ))}

          <Pressable
            onPress={handleContinue}
            className="mb-8 mt-6 rounded-2xl bg-primary py-4"
          >
            <Text className="text-center text-lg font-semibold text-white">
              Continuar con el {plans.find((p) => p.id === selectedPlan)?.name}
            </Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
