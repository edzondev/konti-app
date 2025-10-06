import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "@/constants/icons";
import { Link, useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { cn } from "@/lib/utils";

const receipts = [
  {
    id: "001",
    date: "15 Mar 2025",
    amount: "S/ 1,250.00",
    isExpense: true,
    ruc: "20123456789",
    businessName: "Corporación Tech Solutions S.A.C.",
    receiptNumber: "F001-00001234",
    description: "Servicios de consultoría tecnológica",
    imageUrl: "/factura-electronica-peruana.jpg",
  },
  {
    id: "002",
    date: "14 Mar 2025",
    amount: "S/ 450.00",
    isExpense: false,
    ruc: "20987654321",
    businessName: "Distribuidora Lima Norte E.I.R.L.",
    receiptNumber: "B001-00005678",
    description: "Compra de materiales de oficina",
    imageUrl: "/boleta-de-venta-peruana.jpg",
  },
  {
    id: "003",
    date: "12 Mar 2025",
    amount: "S/ 2,100.00",
    isExpense: true,
    ruc: "20456789123",
    businessName: "Servicios Empresariales del Sur S.A.",
    receiptNumber: "F001-00002345",
    description: "Mantenimiento de equipos informáticos",
    imageUrl: "/comprobante-de-pago-sunat.jpg",
  },
  { id: "004", date: "10 Mar 2025", amount: "S/ 780.00", isExpense: true },
  { id: "005", date: "08 Mar 2025", amount: "S/ 320.00", isExpense: false },
  { id: "006", date: "05 Mar 2025", amount: "S/ 1,890.00", isExpense: true },
  { id: "007", date: "03 Mar 2025", amount: "S/ 560.00", isExpense: false },
  { id: "008", date: "01 Mar 2025", amount: "S/ 1,450.00", isExpense: true },
];

export default function Index() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const handleCameraPress = () => {
    if (permission && permission.granted) {
      router.push("/camera");
    } else {
      router.push("/camera-permission");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="mx-auto w-full px-6 py-8">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, gap: 16 }}
        >
          {receipts.map((receipt) => (
            <View
              key={receipt.id}
              className="rounded-lg border border-neutral-border px-4 py-2"
            >
              <Link href={`/recipe/${receipt.id}`} asChild>
                <Pressable className="flex-row items-end justify-between py-5">
                  {({ pressed }) => (
                    <View className="flex-col items-start gap-y-2">
                      <Text className="font-geist-semibold text-base font-semibold text-neutral-foreground">
                        {receipt.businessName}
                      </Text>
                      <View className="w-full flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <View
                            className={cn(
                              "h-2 w-2 flex-shrink-0 rounded-full",
                              receipt.isExpense
                                ? "bg-primary"
                                : "border border-muted-foreground/30",
                            )}
                          />

                          <Text
                            className={cn(
                              "font-geist-regular  text-base font-normal text-neutral-foreground",
                              pressed ? "text-primary" : "",
                            )}
                          >
                            {receipt.amount}
                          </Text>
                        </View>

                        <Text
                          className={cn(
                            "font-geist-regular text-sm font-light text-muted-foreground",
                            pressed ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {receipt.date}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              </Link>
            </View>
          ))}
        </ScrollView>
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
