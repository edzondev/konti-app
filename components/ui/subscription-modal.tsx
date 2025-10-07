import React, { useEffect, useState } from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import {
  Crown,
  Check,
  ArrowLeft,
  Users,
  FileText,
  CreditCard,
  Zap,
  BarChart3,
  Link,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface Plan {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  isPopular?: boolean;
  features: string[];
  icon: React.ComponentType<any>;
  gradient: string[];
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter Plan",
    price: "$15.99",
    originalPrice: "$19.99",
    isPopular: true,
    features: [
      "Unlimited clients and projects",
      "Invoices and payment",
      "Proposals and contract",
    ],
    icon: Crown,
    gradient: ["#8B5CF6", "#A855F7"],
  },
  {
    id: "essentials",
    name: "Essentials Plan",
    price: "$18.99",
    originalPrice: "$22.99",
    features: [
      "Remove powered by Honeybook",
      "Expense management",
      "Quickbooks online integration",
    ],
    icon: Crown,
    gradient: ["#6B7280", "#374151"],
  },
];

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onPlanSelect?: (planId: string) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  onPlanSelect,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string>("starter");
  
  const overlayOpacity = useSharedValue(0);
  const slideY = useSharedValue(100);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      slideY.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
      contentOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    } else {
      overlayOpacity.value = withTiming(0, { duration: 250 });
      slideY.value = withTiming(100, { duration: 250 });
      contentOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
    opacity: contentOpacity.value,
  }));

  const handleClose = () => {
    overlayOpacity.value = withTiming(0, { duration: 250 });
    slideY.value = withTiming(100, { duration: 250 });
    contentOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    onPlanSelect?.(planId);
  };

  const PlanCard = ({ plan, index }: { plan: Plan; index: number }) => {
    const isSelected = selectedPlan === plan.id;
    const cardScale = useSharedValue(1);
    const checkScale = useSharedValue(0);

    useEffect(() => {
      if (isSelected) {
        checkScale.value = withSpring(1, {
          damping: 15,
          stiffness: 300,
        });
      } else {
        checkScale.value = withTiming(0, { duration: 200 });
      }
    }, [isSelected]);

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    const checkAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: checkScale.value }],
    }));

    const onPressIn = () => {
      cardScale.value = withSpring(0.98, {
        damping: 20,
        stiffness: 400,
      });
    };

    const onPressOut = () => {
      cardScale.value = withSpring(1, {
        damping: 20,
        stiffness: 400,
      });
    };

    const IconComponent = plan.icon;

    return (
      <Pressable
        onPress={() => handlePlanSelect(plan.id)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className="mb-4"
      >
        <Animated.View
          style={[
            cardAnimatedStyle,
            plan.isPopular && {
              backgroundColor: '#8B5CF6',
              shadowColor: '#8B5CF6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 12,
            }
          ]}
          className={`relative rounded-3xl p-6 ${
            plan.isPopular
              ? ""
              : "bg-white border border-gray-200 shadow-sm"
          }`}
        >
          {plan.isPopular && (
            <View className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-semibold">Included</Text>
            </View>
          )}

          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center">
              <View className={`p-2 rounded-xl ${plan.isPopular ? "bg-white/20" : "bg-gray-100"}`}>
                <IconComponent
                  size={24}
                  color={plan.isPopular ? "#ffffff" : "#6B7280"}
                />
              </View>
              <View className="ml-3">
                <Text
                  className={`text-lg font-bold ${
                    plan.isPopular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </Text>
                <Text
                  className={`text-sm ${
                    plan.isPopular ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  Seamless client experiences
                </Text>
              </View>
            </View>

            <View className="items-end">
              <View className="flex-row items-baseline">
                <Text
                  className={`text-2xl font-bold ${
                    plan.isPopular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.price}
                </Text>
                {plan.originalPrice && (
                  <Text
                    className={`text-sm line-through ml-2 ${
                      plan.isPopular ? "text-white/60" : "text-gray-400"
                    }`}
                  >
                    {plan.originalPrice}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className="mb-4">
            <Text
              className={`text-sm font-semibold mb-3 ${
                plan.isPopular ? "text-white" : "text-gray-700"
              }`}
            >
              Features
            </Text>
            {plan.features.map((feature, featureIndex) => (
              <View key={featureIndex} className="flex-row items-center mb-2">
                <View
                  className={`w-5 h-5 rounded-full items-center justify-center ${
                    plan.isPopular ? "bg-white/20" : "bg-green-100"
                  }`}
                >
                  <Check
                    size={12}
                    color={plan.isPopular ? "#ffffff" : "#10B981"}
                  />
                </View>
                <Text
                  className={`ml-3 text-sm ${
                    plan.isPopular ? "text-white/90" : "text-gray-600"
                  }`}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {isSelected && (
            <Animated.View
              style={[checkAnimatedStyle]}
              className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full items-center justify-center shadow-lg"
            >
              <Check size={16} color="#ffffff" />
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[overlayAnimatedStyle]}
        className="flex-1 bg-black/40"
      >
        <Pressable className="flex-1" onPress={handleClose}>
          <Animated.View
            style={[modalAnimatedStyle]}
            className="flex-1 bg-white rounded-t-3xl mt-20"
          >
            <Pressable onPress={(e) => e.stopPropagation()} className="flex-1">
              <View className="px-6 py-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#6B7280" />
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-gray-900">
                    Subscription plan
                  </Text>
                  <View className="w-8" />
                </View>
              </View>

              <View className="flex-row justify-center mt-6 mb-8">
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                  <TouchableOpacity className="bg-blue-500 rounded-lg px-6 py-2">
                    <Text className="text-white font-medium">Monthly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="px-6 py-2">
                    <Text className="text-gray-600 font-medium">Yearly</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
              >
                {plans.map((plan, index) => (
                  <PlanCard key={plan.id} plan={plan} index={index} />
                ))}

                <TouchableOpacity className="bg-blue-500 rounded-2xl py-4 mt-6 mb-8">
                  <Text className="text-white text-center text-lg font-semibold">
                    Continue with {plans.find(p => p.id === selectedPlan)?.name}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </RNModal>
  );
};