import { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';

import { AnimatedSwitch } from '@/components/ui/animated-switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import DocumentTypeDisplay from '@/components/shared/receipt/document-type-display';
import { COLORS } from '@/constants/colors';
import useReceiptForm from '@/hooks/use-receipt-form';

import type { AiExtractedData } from '@/types/ai-extraction.types';

type Props = {
  imageUrl: string;
  extractedData?: AiExtractedData;
};

export default function ReceiptForm({ imageUrl, extractedData }: Props) {
  const { form, onSubmit, isPending, handleCancel, fillFormWithExtractedData } =
    useReceiptForm(imageUrl);

  useEffect(() => {
    if (extractedData) {
      fillFormWithExtractedData(extractedData);
    }
  }, [extractedData, fillFormWithExtractedData]);

  return (
    <View className="flex-1">
      {/* Form Content */}
      <View className="mb-8 gap-y-5">
        <Form {...form}>
          {/* Document Type Selector */}
          <FormField
            control={form.control}
            name="receiptType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DocumentTypeDisplay
                    value={field.value ?? 'boleta'}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Section: Amount */}
          <View className="rounded-2xl bg-neutral-50 p-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                    Monto Total *
                  </FormLabel>
                  <FormControl>
                    <View className="flex-row items-center">
                      <Text className="mr-2 text-2xl font-medium text-neutral-400">
                        S/
                      </Text>
                      <Input
                        readOnly={isPending}
                        className="flex-1 border-0 bg-transparent text-4xl font-bold"
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        {...field}
                        value={field.value}
                        onChangeText={field.onChange}
                      />
                    </View>
                  </FormControl>
                  {form.formState.errors.amount && (
                    <FormMessage className="mt-2">
                      {form.formState.errors.amount.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
          </View>

          {/* Section: Receipt Details */}
          <View className="gap-y-4">
            <Text className="text-sm font-semibold text-neutral-900">
              Datos del comprobante
            </Text>

            <FormField
              control={form.control}
              name="receiptNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-neutral-500">
                    Número de comprobante
                  </FormLabel>
                  <FormControl>
                    <Input
                      readOnly={isPending}
                      placeholder="F001-00001234"
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
                      {...field}
                      value={field.value}
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
                  <FormLabel className="text-xs font-medium text-neutral-500">
                    RUC
                  </FormLabel>
                  <FormControl>
                    <Input
                      readOnly={isPending}
                      placeholder="20123456789"
                      keyboardType="number-pad"
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
                      {...field}
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  </FormControl>
                  {form.formState.errors.ruc && (
                    <FormMessage className="mt-1">
                      {form.formState.errors.ruc.message}
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-neutral-500">
                    Razón social
                  </FormLabel>
                  <FormControl>
                    <Input
                      readOnly={isPending}
                      placeholder="Nombre de la empresa"
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
                      {...field}
                      value={field.value}
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
                  <FormLabel className="text-xs font-medium text-neutral-500">
                    Descripción
                  </FormLabel>
                  <FormControl>
                    <Input
                      readOnly={isPending}
                      placeholder="Concepto o detalle del comprobante"
                      multiline={true}
                      numberOfLines={3}
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-3"
                      style={{
                        height: 80,
                        textAlignVertical: 'top',
                      }}
                      {...field}
                      value={field.value}
                      onChangeText={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </View>

          {/* Section: Expense Toggle */}
          <FormField
            control={form.control}
            name="isExpense"
            render={({ field }) => (
              <FormItem className="flex-row items-center justify-between rounded-2xl bg-neutral-50 p-4">
                <View className="flex-1">
                  <FormLabel className="text-base font-medium text-neutral-900">
                    Es gasto contable
                  </FormLabel>
                  <Text className="mt-0.5 text-xs text-neutral-500">
                    Marcar si es deducible de impuestos
                  </Text>
                </View>
                <FormControl>
                  <AnimatedSwitch
                    trackColor={{
                      false: '#E5E5E5',
                      true: COLORS.success.default,
                    }}
                    thumbColor={COLORS.neutral.white}
                    disabled={isPending}
                    value={field.value ?? false}
                    onValueChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </Form>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-x-3">
        <Pressable
          disabled={isPending}
          onPress={handleCancel}
          className="flex-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white py-4 active:bg-neutral-50 disabled:opacity-50"
        >
          <Text className="text-base font-semibold text-neutral-600">
            Cancelar
          </Text>
        </Pressable>

        <Pressable
          onPress={form.handleSubmit(onSubmit)}
          className="bg-primary-default flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-90 disabled:opacity-50"
          disabled={isPending}
        >
          {isPending && (
            <ActivityIndicator size="small" color={COLORS.neutral.white} />
          )}
          <Text className="text-base font-semibold text-white">
            {isPending ? 'Guardando...' : 'Guardar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
