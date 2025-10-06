import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants/colors";
import { useRouter } from "expo-router";
import {
  File,
  ChevronLeft,
  ChevronRight,
  Crown,
  HelpCircle,
  Lock,
  LogOut,
  Shield,
  User,
  Zap,
} from "@/constants/icons";
const userPlan = ["free", "pro", "premium"] as const;

export default function Profile() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="my-8 px-6">
        <View className="flex-row items-center gap-x-4">
          <Pressable
            onPress={() => router.back()}
            className="rounded-full bg-gray-100 p-2"
            aria-label="Volver"
          >
            <ChevronLeft size={20} color={COLORS.neutral.foreground} />
          </Pressable>
          <Text className="font-regular text-lg text-neutral-foreground">
            Mi perfil
          </Text>
        </View>

        <View className="py-8">
          {/* Información del usuario */}
          <View className="mb-8 flex-col items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <User size={32} color={COLORS.primary} />
            </View>
            <View className="flex-col items-center gap-2">
              <Text className="font-regular text-xl text-neutral-foreground">
                Juan Pérez
              </Text>
              <Text className="text-sm font-light text-muted-foreground">
                juan.perez@email.com
              </Text>
            </View>
          </View>

          {/* Sección General */}
          <View className="mb-8">
            <Text className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              General
            </Text>
            <View className="overflow-hidden rounded-lg border border-neutral-border bg-white">
              <Pressable
                //onClick={() => handleReceiptClick(receipts[0])}
                className="w-full flex-row items-center justify-between px-4 py-6"
              >
                <View className="flex-row items-center gap-3">
                  <File
                    className="h-5 w-5 text-muted-foreground"
                    size={20}
                    color={COLORS.muted.foreground}
                  />
                  <Text className="text-sm font-light text-neutral-foreground">
                    Mis boletas
                  </Text>
                </View>
                <ChevronRight
                  className="h-5 w-5 text-muted-foreground"
                  size={20}
                  color={COLORS.muted.foreground}
                />
              </Pressable>

              <Pressable
                //onClick={() => setProfileView("plans")}
                className="w-full flex-row items-center justify-between border-y border-neutral-border px-4 py-6"
              >
                <View className="flex-row items-center gap-3">
                  {userPlan.includes("free") !== false && (
                    <Zap size={20} color={COLORS.muted.foreground} />
                  )}
                  {userPlan.includes("pro") !== false && (
                    <Zap size={20} color={COLORS.primary} />
                  )}
                  {userPlan.includes("premium") !== false && (
                    <Crown className="text-amber-600" size={20} />
                  )}
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-light text-neutral-foreground">
                      Mi plan
                    </Text>
                    {userPlan.includes("free") !== false && (
                      <Text className="bg-muted rounded px-2 py-0.5 text-xs font-light text-neutral-foreground">
                        Free
                      </Text>
                    )}
                    {userPlan.includes("pro") !== false && (
                      <Text className="rounded bg-primary/10 px-2 py-0.5 text-xs font-light text-primary">
                        Pro
                      </Text>
                    )}
                    {userPlan.includes("premium") !== false && (
                      <Text className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-light text-amber-600">
                        Premium
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>

              <Pressable className="w-full flex-row items-center justify-between px-4 py-6">
                <View className="flex-row items-center gap-3">
                  <Lock size={20} color={COLORS.muted.foreground} />
                  <Text className="text-sm font-light text-neutral-foreground">
                    Cambiar contraseña
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Sección Soporte */}
          <View className="mb-8">
            <Text className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Soporte
            </Text>
            <View className="overflow-hidden rounded-lg border border-neutral-border bg-white">
              <Pressable className="w-full flex-row items-center justify-between px-4 py-6">
                <View className="flex-row items-center gap-3">
                  <HelpCircle size={20} color={COLORS.muted.foreground} />
                  <Text className="text-sm font-light text-neutral-foreground">
                    ¿Necesitas ayuda?
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>

              <Pressable className="w-full flex-row items-center justify-between border-y border-neutral-border px-4 py-6">
                <View className="flex-row items-center gap-3">
                  <Shield size={20} color={COLORS.muted.foreground} />
                  <Text className="text-sm font-light text-neutral-foreground">
                    Política de privacidad
                  </Text>
                </View>
                <ChevronRight size={20} color={COLORS.muted.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Cerrar sesión */}
          <Pressable className="text-destructive bg-destructive/5 w-full flex-row items-center justify-center gap-3 rounded-lg py-4">
            <LogOut size={20} color={COLORS.destructive} />
            <Text className="text-destructive font-regular text-destructive text-lg">
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
