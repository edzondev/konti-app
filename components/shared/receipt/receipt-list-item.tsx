import { Link } from "expo-router";
import { Pressable, View, Text } from "react-native";
import type { Tables } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { dateFormat } from "@/lib/date-format";

type Props = {
  receipt: Tables<"receipts">;
};

export default memo(function ReceiptListItem({ receipt }: Props) {
  return (
    <View className="rounded-lg border border-neutral-border px-4 py-2">
      <Link href={`/recipe/${receipt.id}`} asChild>
        <Pressable className="flex-row items-end justify-between py-5">
          {({ pressed }) => (
            <View className="flex-col items-start gap-y-2">
              <Text className="font-geist-semibold text-base font-semibold text-neutral-foreground">
                {receipt.business_name}
              </Text>
              <View className="w-full flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View
                    className={cn(
                      "h-2 w-2 flex-shrink-0 rounded-full",
                      receipt.is_expense
                        ? "bg-primary"
                        : "border border-muted-foreground/30",
                    )}
                  />

                  <Text
                    className={cn(
                      "font-geist-regular  text-base font-normal text-neutral-foreground",
                      pressed ? "text-primary" : "",
                    )}
                  >
                    S/ {receipt.total_amount?.toFixed(2)}
                  </Text>
                </View>

                <Text
                  className={cn(
                    "font-geist-regular text-sm font-light text-muted-foreground",
                    pressed ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {dateFormat(receipt.created_at ?? "")}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      </Link>
    </View>
  );
});
