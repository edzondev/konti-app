import { View, Text, Image } from "react-native";
import { Calendar, FileText, CreditCard, Building2 } from "@/constants/icons";
import { COLORS } from "@/constants/colors";
import { memo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  selectedReceipt: any;
};

function ReceiptCard({ selectedReceipt }: Props) {
  return (
    <View className="px-6 py-8">
      {selectedReceipt.imageUrl && (
        <View className="mb-8 overflow-hidden rounded-lg border border-neutral-border">
          <Image
            source={{ uri: selectedReceipt.imageUrl }}
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
            {selectedReceipt.amount}
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
              {selectedReceipt.date}
            </Text>
          </View>
        </View>

        {selectedReceipt.receiptNumber && (
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
                {selectedReceipt.receiptNumber}
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

        {selectedReceipt.businessName && (
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
                {selectedReceipt.businessName}
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
                selectedReceipt.isExpense
                  ? "bg-primary"
                  : "border border-muted-foreground/30",
              )}
            />
            <Text className="text-base font-light text-neutral-foreground">
              {selectedReceipt.isExpense ? "Sí" : "No"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
export default memo(ReceiptCard);
