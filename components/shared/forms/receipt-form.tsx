import useReceiptForm from "@/hooks/use-receipt-form";
import { View, Text, Pressable, Switch } from "react-native";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COLORS } from "@/constants/colors";
import { Check } from "@/constants/icons";

export default function ReceiptForm() {
  const { form, onSubmit } = useReceiptForm();
  return (
    <>
      <View className="mb-12 gap-y-6">
        <Form {...form}>
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto *</FormLabel>
                <FormControl>
                  <View className="relative">
                    <Text className="absolute left-2 top-1/2 -translate-y-1/2 text-base font-light text-muted-foreground">
                      S/
                    </Text>
                    <Input
                      className="pl-8 text-3xl"
                      placeholder="0.00"
                      {...field}
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  </View>
                </FormControl>
                {form.formState.errors.amount && (
                  <FormMessage>
                    {form.formState.errors.amount.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="receiptNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de comprobante</FormLabel>
                <FormControl>
                  <Input
                    placeholder="F001-00001234"
                    {...field}
                    value={field.value.toString()}
                    onChangeText={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ruc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RUC</FormLabel>
                <FormControl>
                  <Input
                    placeholder="20123456789"
                    {...field}
                    value={field.value.toString()}
                    onChangeText={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón social</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre de la empresa"
                    {...field}
                    value={field.value.toString()}
                    onChangeText={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Concepto o detalle del comprobante"
                    multiline={true}
                    numberOfLines={4}
                    style={{
                      height: 80,
                      textAlignVertical: "top",
                    }}
                    {...field}
                    value={field.value.toString()}
                    onChangeText={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isExpense"
            render={({ field }) => (
              <FormItem className="flex-row items-center justify-between">
                <FormLabel>Es gasto contable</FormLabel>
                <FormControl>
                  <Switch
                    trackColor={{
                      false: "#bdbdbd",
                      true: COLORS.primary,
                    }}
                    thumbColor={COLORS.neutral.white}
                    aria-label="Toggle gasto contable"
                    ios_backgroundColor="#3e3e3e"
                    {...field}
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </Form>
      </View>
      {/* Botones de Acción */}
      <View className="flex-row gap-x-4">
        <Pressable
          onPress={() => {}}
          className="flex-1 flex-row items-center justify-center rounded-lg bg-muted-foreground/10 py-3 text-neutral-foreground"
        >
          {({ pressed }) => (
            <Text
              className={cn(
                "font-geist-regular text-muted-foreground",
                pressed ? "text-neutral-foreground" : "",
              )}
            >
              Cancelar
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={form.handleSubmit(onSubmit)}
          className="flex-1 rounded-lg bg-primary py-3 text-white"
        >
          {({ pressed }) => (
            <View
              className={cn(
                "flex-row items-center justify-center gap-2",
                pressed ? "opacity-70" : "",
              )}
            >
              <Check size={20} color={COLORS.neutral.white} />
              <Text className="font-geist-regular text-white">Guardar</Text>
            </View>
          )}
        </Pressable>
      </View>
    </>
  );
}
