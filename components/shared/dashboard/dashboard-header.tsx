import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

export default function DashboardHeader() {
  const router = useRouter();
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Image
            source={require("@/assets/images/icon.png")}
            className="h-10 w-10 rounded-full"
          />
          <Text className="text-2xl font-semibold text-[#27447b]">Kinto</Text>
        </View>

        <Pressable
          className="flex-row items-center gap-2 rounded-full px-4 py-2"
          style={{ backgroundColor: COLORS.primary }}
          onPress={() => {
            router.push("/subscription");
          }}
        >
          <Sparkles size={16} color="white" />
          <Text className="text-sm font-bold text-white">Vuélvete PRO</Text>
        </Pressable>
      </View>
    </View>
  );
}
