import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  receiptSchema,
  type ReceiptSchema,
} from "@/utils/schemas/receipt.schema";
import { useRouter } from "expo-router";

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

  const onSubmit = async (data: ReceiptSchema) => {
    console.log(data);
    router.push("/success");
  };

  return { form, onSubmit };
}
