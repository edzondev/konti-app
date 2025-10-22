import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Link } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { useLogin } from '@/hooks/auth/use-login';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function Login() {
  const { form, onSubmit, handleCancel, isLoading } = useLogin();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mt-8 px-5">
            <Pressable onPress={handleCancel}>
              <ChevronLeft size={24} color={COLORS.neutral.foreground} />
            </Pressable>
          </View>

          {/* Content */}
          <View className="flex-1 justify-center">
            <View className="px-6 pt-8">
              {/* Title */}
              <Text
                className="text-3xl font-bold text-neutral-foreground"
                numberOfLines={1}
              >
                Iniciar sesión
              </Text>
              <Text
                className="mt-2 text-base font-normal text-muted-foreground"
                numberOfLines={2}
              >
                Ingresa tu email y contraseña para iniciar sesión.
              </Text>

              <View className="mt-8 gap-y-6">
                <Form {...form}>
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
              >
                <Text className="text-center text-base font-semibold text-white">
                  {isLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.neutral.white}
                    />
                  ) : (
                    'Iniciar sesión'
                  )}
                </Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View className="mb-8 mt-6 flex-row justify-center">
                <Text className="text-base text-muted-foreground">
                  ¿No tienes una cuenta?{' '}
                </Text>
                <Link href="/register" asChild>
                  <Pressable>
                    <Text className="text-base font-medium text-primary">
                      Registrarse.
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
