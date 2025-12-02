import { Link } from 'expo-router';
import { Pressable, View, Text } from 'react-native';
import type { Tables } from '@/types/database.types';
import { memo } from 'react';
import { dateFormat } from '@/lib/date-format';

type Props = {
  receipt: Tables<'receipts'>;
};

export default memo(function ReceiptListItem({ receipt }: Props) {
  return (
    <>
      <Link href={`/receipt/${receipt.id}`} asChild>
        <Pressable className="flex-row items-center justify-between gap-x-4">
          {() => (
            <>
              <View className="flex-row items-center gap-4 rounded-2xl border border-neutral-border bg-white p-4">
                <View className="min-w-0 flex-1">
                  <Text
                    className="mb-0.5 text-sm font-normal text-neutral-foreground"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {receipt.business_name ||
                      receipt.receipt_number ||
                      'Comprobante'}
                  </Text>
                  <Text
                    className="text-xs font-normal text-neutral-muted"
                    numberOfLines={1}
                  >
                    {dateFormat(receipt.created_at ?? '')}
                  </Text>
                </View>
                <View className="flex shrink-0 flex-col items-end gap-1">
                  <Text
                    className="text-base font-semibold text-neutral-foreground"
                    numberOfLines={1}
                  >
                    S/ {receipt.total_amount?.toFixed(2)}
                  </Text>
                  {receipt.is_expense && (
                    <Text
                      className="rounded bg-primary-default/10 px-2 py-0.5 text-xs font-normal text-primary-default"
                      numberOfLines={1}
                    >
                      Contable
                    </Text>
                  )}
                </View>
              </View>
            </>
          )}
        </Pressable>
      </Link>
    </>
  );
});
