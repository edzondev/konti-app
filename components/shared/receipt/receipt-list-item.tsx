import { Link } from "expo-router";
import { Pressable, View, Text } from "react-native";
import type { Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { dateFormat } from "@/lib/date-format";
import { FileText } from "lucide-react-native";
import { COLORS } from "@/constants/colors";

type Props = {
  receipt: Tables<"receipts">;
};

export default memo(function ReceiptListItem({ receipt }: Props) {
  return (
    <View className="rounded-2xl border border-neutral-border bg-white px-4 py-2">
      <Link href={`/recipe/${receipt.id}`} asChild>
        <Pressable className="flex-row items-center justify-between gap-x-4 py-5">
          {({ pressed }) => (
            <>
              <View className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-neutral-border">
                <FileText size={24} color={COLORS.muted.foreground} />
              </View>
              <View className="min-w-0 flex-1 flex-col gap-y-0.5">
                <Text className="mb-0.5 truncate text-base font-semibold text-muted-foreground">
                  {receipt.business_name ||
                    receipt.receipt_number ||
                    "Comprobante"}
                </Text>
                <Text className="text-sm font-light text-muted-foreground">
                  {dateFormat(receipt.created_at ?? "")}
                </Text>
              </View>
              <View className="flex flex-col items-end gap-1">
                <Text className="text-lg font-normal text-neutral-foreground">
                  S/ {receipt.total_amount?.toFixed(2)}
                </Text>
                {receipt.is_expense && (
                  <Text className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Contable
                  </Text>
                )}
              </View>
            </>
          )}
        </Pressable>
      </Link>
    </View>
  );
});
