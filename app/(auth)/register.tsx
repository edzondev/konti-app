import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Eye, EyeOff } from "@/constants/icons";
import { Link } from "expo-router";
import { COLORS } from "@/constants/colors";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRegister } from "@/hooks/auth/use-register";

export default function Register() {
  const { form, onSubmit, handleCancel, isLoading } = useRegister();

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
          <TouchableOpacity onPress={handleCancel}>
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
            <Text className="mt-2 text-base font-light text-muted-foreground">
              Ingresa tu email, nombre y contraseña para registrarte.
            </Text>

            <View className="mt-8 gap-y-6">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-lg border border-neutral-border px-4 py-3 text-base"
                          placeholder="Juan Perez"
                          keyboardType="default"
                          autoCapitalize="words"
                          autoComplete="name"
                          autoCorrect={false}
                          autoFocus={false}
                          returnKeyType="next"
                          returnKeyLabel="next"
                          readOnly={isLoading}
                          {...field}
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.name && (
                        <FormMessage>
                          {form.formState.errors.name.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-lg border border-neutral-border px-4 py-3 text-base"
                          placeholder="ejemplo@gmail.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          autoFocus={false}
                          returnKeyType="next"
                          returnKeyLabel="next"
                          readOnly={isLoading}
                          {...field}
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.email && (
                        <FormMessage>
                          {form.formState.errors.email.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-lg border border-neutral-border px-4 py-3 text-base"
                          placeholder="********"
                          {...field}
                          secureTextEntry={true}
                          returnKeyLabel="done"
                          returnKeyType="done"
                          autoCapitalize="none"
                          autoComplete="password"
                          autoCorrect={false}
                          autoFocus={false}
                          readOnly={isLoading}
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      </FormControl>
                      {form.formState.errors.password && (
                        <FormMessage>
                          {form.formState.errors.password.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              </Form>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={form.handleSubmit(onSubmit)}
              className="mt-8 rounded-lg bg-primary py-4"
              disabled={isLoading}
            >
              <Text className="text-center text-base font-semibold text-white">
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.neutral.white}
                  />
                ) : (
                  "Registrarse"
                )}
              </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View className="mb-8 mt-6 flex-row justify-center">
              <Text className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
              </Text>
              <Link href="/login" asChild>
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
