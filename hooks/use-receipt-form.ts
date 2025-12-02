import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  receiptSchema,
  type ReceiptSchema,
} from '@/utils/schemas/receipt.schema';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useCreateReceipt } from './receipts/use-receipts';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuth } from '@/components/providers/auth-provider';
import { AiExtractedData } from '@/types/ai-extraction.types';
import { useCallback } from 'react';

const defaultValues: Partial<ReceiptSchema> = {
  amount: '',
  receiptType: 'boleta',
  isExpense: false,
  ruc: '',
  businessName: '',
  receiptNumber: '',
  description: '',
};

export default function useReceiptForm(imageUrl: string) {
  const router = useRouter();
  const { session } = useAuth();

  const queryClient = useQueryClient();
  const form = useForm<ReceiptSchema>({
    resolver: zodResolver(receiptSchema),
    defaultValues: defaultValues
      ? defaultValues
      : {
          amount: '',
          receiptType: 'boleta',
          isExpense: false,
          ruc: '',
          businessName: '',
          receiptNumber: '',
          description: '',
        },
  });
  const {
    mutateAsync: createReceiptFn,
    isPending,
    isError,
  } = useCreateReceipt(imageUrl, session?.user.id || '');

  const handleCancel = () => {
    form.reset();
    router.back();
  };

  const fillFormWithExtractedData = useCallback(
    (extractedData: AiExtractedData) => {
      // Convert monto_total to string (API may return it as number)
      const amount =
        extractedData.monto_total != null
          ? String(extractedData.monto_total)
          : '';

      form.setValue('amount', amount);
      form.setValue('receiptType', extractedData.tipo_comprobante);
      form.setValue('receiptNumber', extractedData.numero_comprobante ?? '');
      form.setValue('ruc', extractedData.ruc ?? '');
      form.setValue('businessName', extractedData.razon_social ?? '');
      form.setValue('description', extractedData.justificacion_contable ?? '');
      form.setValue('isExpense', extractedData.es_contable ?? false);
    },
    [form],
  );

  const onSubmit = async (data: ReceiptSchema) => {
    try {
      if (!session) {
        Alert.alert(
          'Error',
          'Debes iniciar sesión para guardar un comprobante',
        );
        return;
      }

      await createReceiptFn(data);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.receipts.all(session.user.id),
      });
      form.reset();
      router.push('/success');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado. Intenta nuevamente.';
      Alert.alert('Error', errorMessage);
    }
  };

  return {
    form,
    onSubmit,
    isPending,
    isError,
    handleCancel,
    fillFormWithExtractedData,
  };
}
