import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import ImageComponent from '@/components/ui/image';
import {
  Calendar,
  FileText,
  CreditCard,
  Building2,
  Trash,
} from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Tables } from '@/types/database.types';
import { dateFormat } from '@/lib/date-format';

type Props = {
  selectedReceipt: Tables<'receipts'>;
  handleDeleteReceipt: () => void;
  isDeleting: boolean;
};

function ReceiptCard({
  selectedReceipt,
  handleDeleteReceipt,
  isDeleting,
}: Props) {
  return (
    <View className="">
      {selectedReceipt.image_url && (
        <View className="mb-8 overflow-hidden rounded-lg border border-neutral-border">
          <ImageComponent
            src={selectedReceipt.image_url}
            contentFit="cover"
            style={{ width: '100%', height: 350 }}
            alt="Comprobante"
          />
        </View>
      )}

      <View className="gap-y-6">
        <View className="flex-col">
          <Text className="mb-1 text-sm font-normal text-muted-foreground">
            Monto
          </Text>
          <Text
            className="text-4xl font-normal text-neutral-foreground"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
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
            <Text className="mb-1 text-sm font-normal text-muted-foreground">
              Fecha
            </Text>
            <Text
              className="text-base font-normal text-neutral-foreground"
              numberOfLines={1}
            >
              {dateFormat(selectedReceipt.created_at ?? '')}
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
              <Text className="mb-1 text-sm font-normal text-muted-foreground">
                N° Comprobante
              </Text>
              <Text
                className="text-base font-normal text-neutral-foreground"
                numberOfLines={2}
              >
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
              <Text className="mb-1 text-sm font-normal text-muted-foreground">
                RUC
              </Text>
              <Text
                className="text-base font-normal text-neutral-foreground"
                numberOfLines={1}
              >
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
              <Text className="mb-1 text-sm font-normal text-muted-foreground">
                Razón social
              </Text>
              <Text
                className="text-base font-normal text-neutral-foreground"
                numberOfLines={2}
              >
                {selectedReceipt.business_name}
              </Text>
            </View>
          </View>
        )}

        {selectedReceipt.description && (
          <View className="flex-col">
            <Text className="mb-2 text-sm font-normal text-muted-foreground">
              Descripción
            </Text>
            <Text className="text-base font-normal leading-relaxed text-neutral-foreground">
              {selectedReceipt.description}
            </Text>
          </View>
        )}

        <View className="flex-row items-center justify-between rounded-lg bg-neutral-100 px-4 py-4">
          <Text
            className="text-base font-normal text-muted-foreground"
            numberOfLines={1}
          >
            Gasto contable
          </Text>
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                'h-2 w-2 rounded-full',
                selectedReceipt.is_expense
                  ? 'bg-primary'
                  : 'border border-muted-foreground/30',
              )}
            />
            <Text
              className="text-base font-normal text-neutral-foreground"
              numberOfLines={1}
            >
              {selectedReceipt.is_expense ? 'Sí' : 'No'}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        disabled={isDeleting}
        className="mt-6 h-14 flex-row items-center justify-center gap-2 rounded-lg bg-red-500 px-4"
        onPress={handleDeleteReceipt}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={COLORS.neutral.white} />
        ) : (
          <>
            <Trash color={COLORS.neutral.white} size={20} />
            <Text
              className="text-base font-semibold text-neutral-white"
              numberOfLines={1}
            >
              Eliminar boleta
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
export default memo(ReceiptCard);
