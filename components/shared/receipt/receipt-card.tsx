import { View, Text, Image } from "react-native";
import { Calendar, FileText, CreditCard, Building2 } from "@/constants/icons";
import { COLORS } from "@/constants/colors";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";
import { dateFormat } from "@/lib/date-format";

type Props = {
  selectedReceipt: Tables<"receipts">;
};

function ReceiptCard({ selectedReceipt }: Props) {
  return (
    <View className="px-6 py-8">
      {selectedReceipt.image_url && (
        <View className="mb-8 overflow-hidden rounded-lg border border-neutral-border">
          <Image
            source={{ uri: selectedReceipt.image_url }}
            resizeMode="cover"
            style={{ width: "100%", height: 100 }}
            alt="Comprobante"
          />
        </View>
      )}

      <View className="gap-y-6">
        <View className="flex-col">
          <Text className="mb-1 text-base font-light text-muted-foreground">
            Monto
          </Text>
          <Text className="text-4xl font-light text-neutral-foreground">
            S/ {selectedReceipt.total_amount?.toFixed(2)}
          </Text>
        </View>

        <View className="flex-row items-start gap-4">
          <Calendar
            className="mt-0.5"
            color={COLORS.muted.foreground}
            size={20}
          />
          <View className="flex-1">
            <Text className="mb-1 text-base font-light text-muted-foreground">
              Fecha
            </Text>
            <Text className="text-base font-light text-neutral-foreground">
              {dateFormat(selectedReceipt.created_at ?? "")}
            </Text>
          </View>
        </View>

        {selectedReceipt.receipt_number && (
          <View className="flex-row items-start gap-4">
            <FileText
              className="mt-0.5"
              color={COLORS.muted.foreground}
              size={20}
            />
            <View className="flex-1">
              <Text className="mb-1 text-base font-light text-muted-foreground">
                N° Comprobante
              </Text>
              <Text className="text-base font-light text-neutral-foreground">
                {selectedReceipt.receipt_number}
              </Text>
            </View>
          </View>
        )}

        {selectedReceipt.ruc && (
          <View className="flex-row items-start gap-4">
            <CreditCard
              className="mt-0.5"
              color={COLORS.muted.foreground}
              size={20}
            />
            <View className="flex-1">
              <Text className="mb-1 text-base font-light text-muted-foreground">
                RUC
              </Text>
              <Text className="text-base font-light text-neutral-foreground">
                {selectedReceipt.ruc}
              </Text>
            </View>
          </View>
        )}

        {selectedReceipt.business_name && (
          <View className="flex-row items-start gap-4">
            <Building2
              className="mt-0.5"
              color={COLORS.muted.foreground}
              size={20}
            />
            <View className="flex-1">
              <Text className="mb-1 text-base font-light text-muted-foreground">
                Razón social
              </Text>
              <Text className="text-base font-light text-neutral-foreground">
                {selectedReceipt.business_name}
              </Text>
            </View>
          </View>
        )}

        {selectedReceipt.description && (
          <View className="flex-col">
            <Text className="mb-2 text-base font-light text-muted-foreground">
              Descripción
            </Text>
            <Text className="text-base font-light leading-relaxed text-neutral-foreground">
              {selectedReceipt.description}
            </Text>
          </View>
        )}

        <View className="bg-muted/30 flex-row items-center justify-between rounded-lg px-4 py-4">
          <Text className="text-base font-light text-muted-foreground">
            Gasto contable
          </Text>
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                "h-2 w-2 rounded-full",
                selectedReceipt.is_expense
                  ? "bg-primary"
                  : "border border-muted-foreground/30",
              )}
            />
            <Text className="text-base font-light text-neutral-foreground">
              {selectedReceipt.is_expense ? "Sí" : "No"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
export default memo(ReceiptCard);
