import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  receiptSchema,
  type ReceiptSchema,
} from "@/utils/schemas/receipt.schema";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useCreateReceipt } from "./receipts/use-receipts";
import { supabase } from "@/utils/supabase/supabase";
import { TablesInsert } from "@/types/database.types";

const defaultValues: ReceiptSchema = {
  amount: "",
  isExpense: false,
  ruc: "",
  businessName: "",
  receiptNumber: "",
  description: "",
};

export default function useReceiptForm() {
  const router = useRouter();
  const form = useForm<ReceiptSchema>({
    resolver: zodResolver(receiptSchema),
    defaultValues,
  });
  const { mutateAsync: createReceipt, isPending, isError } = useCreateReceipt();

  const handleCancel = () => {
    form.reset();
    router.back();
  };

  const onSubmit = async (data: ReceiptSchema) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          "Error",
          "Debes iniciar sesión para guardar un comprobante",
        );
        return;
      }

      const receiptData: Omit<TablesInsert<"receipts">, "id"> = {
        total_amount: parseFloat(data.amount),
        is_expense: data.isExpense,
        ruc: data.ruc || null,
        business_name: data.businessName || null,
        receipt_number: data.receiptNumber || null,
        description: data.description || null,
        image_url: "https://",
        user_id: user.id,
      };

      createReceipt(receiptData, {
        onSuccess: () => {
          router.push("/success");
        },
        onError: (error) => {
          Alert.alert(
            "Error",
            "No se pudo guardar el comprobante. Intenta nuevamente.",
          );
        },
      });
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error inesperado. Intenta nuevamente.");
    }
  };

  return { form, onSubmit, isPending, isError, handleCancel };
}
