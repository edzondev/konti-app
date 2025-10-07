import { View, Text, Image, Dimensions } from "react-native";

const { height } = Dimensions.get("window");

export default function Empty() {
  return (
    <View className="flex-1 items-center justify-center">
      <View
        className="flex-col items-center justify-center"
        style={{ height: height * 0.8 }}
      >
        <Image
          source={require("@/assets/images/no_data.png")}
          className="h-24 w-24"
          resizeMode="contain"
        />
        <Text className="text-center text-base font-light text-muted-foreground">
          No hay datos disponibles
        </Text>
      </View>
    </View>
  );
}
