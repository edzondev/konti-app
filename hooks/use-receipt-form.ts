import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  receiptSchema,
  type ReceiptSchema,
} from "@/utils/schemas/receipt.schema";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useCreateReceipt } from "./receipts/use-receipts";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/query-keys";

const defaultValues: ReceiptSchema = {
  amount: "",
  isExpense: false,
  ruc: "",
  businessName: "",
  receiptNumber: "",
  description: "",
};

export default function useReceiptForm(imageUri: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<ReceiptSchema>({
    resolver: zodResolver(receiptSchema),
    defaultValues,
  });
  const {
    mutateAsync: createReceiptFn,
    isPending,
    isError,
  } = useCreateReceipt(imageUri);

  const handleCancel = () => {
    form.reset();
    router.back();
  };

  const onSubmit = async (data: ReceiptSchema) => {
    try {
      /*const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          "Error",
          "Debes iniciar sesión para guardar un comprobante",
        );
        return;
      }*/

      await createReceiptFn(data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.receipts.all });
      form.reset();
      router.push("/success");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Intenta nuevamente.";
      Alert.alert("Error", errorMessage);
    }
  };

  return { form, onSubmit, isPending, isError, handleCancel };
}
