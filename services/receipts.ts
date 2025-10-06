import type { TablesInsert } from "@/types/database.types";
import { supabase } from "@/utils/supabase/supabase";

export default async function getReceipts() {
  const { data, error } = await supabase.from("receipts").select("*");
  if (error) {
    throw error;
  }
  return data;
}

export async function getReceiptDetails(receiptId: string) {
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", receiptId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function createReceipt(
  receipt: Omit<TablesInsert<"receipts">, "id">,
) {
  const { data, error } = await supabase.from("receipts").insert(receipt);
  if (error) {
    throw error;
  }
  return data;
}
