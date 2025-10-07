import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Eye, EyeOff } from "@/constants/icons";
import { Link, router } from "expo-router";
import { COLORS } from "@/constants/colors";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-5 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={COLORS.neutral.foreground} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center">
          <View className="px-6 pt-8">
            {/* Title */}
            <Text className="text-3xl font-semibold text-neutral-foreground">
              Registrarse
            </Text>
            <Text className="mt-2 text-base text-muted-foreground">
              Ingresa tu email y contraseña para registrarte.
            </Text>

            {/* Email Input */}
            <View className="mt-8">
              <Text className="mb-2 text-sm text-neutral-foreground">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa tu email"
                keyboardType="email-address"
                autoCapitalize="none"
                className="rounded-lg border border-neutral-border px-4 py-3 text-base"
              />
            </View>

            {/* Password Input */}
            <View className="mt-5">
              <Text className="mb-2 text-sm text-neutral-foreground">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ingresa tu contraseña"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="rounded-lg border border-neutral-border px-4 py-3 pr-12 text-base"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3"
                >
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.muted.foreground} />
                  ) : (
                    <Eye size={20} color={COLORS.muted.foreground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <View className="mt-3 items-end">
              <TouchableOpacity>
                <Text className="text-sm text-primary">
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <TouchableOpacity className="mt-8 rounded-lg bg-primary py-4">
              <Text className="text-center text-base font-semibold text-white">
                Continuar
              </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View className="mb-8 mt-6 flex-row justify-center">
              <Text className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
              </Text>
              <Link href="/login" asChild dismissTo>
                <Pressable>
                  <Text className="text-sm font-medium text-primary">
                    Iniciar sesión.
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
