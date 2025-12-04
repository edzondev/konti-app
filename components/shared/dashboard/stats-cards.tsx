import { View, Text } from 'react-native';
import { COLORS } from '@/constants/colors';
import IconFolder from '@/assets/icons/icon-folder.svg';
import IconTrendingUp from '@/assets/icons/icon-trend-up.svg';

type StatsCardsProps = {
  totalAmount: number | null;
  totalReceipts: number | null;
  expenseReceipts: number | null;
  isLoading: boolean;
};

export default function StatsCards({
  totalAmount,
  totalReceipts,
  expenseReceipts,
  isLoading,
}: StatsCardsProps) {
  const formattedAmount = totalAmount
    ? `S/ ${totalAmount.toFixed(2)}`
    : 'S/ 0.00';

  return (
    <View className="mb-6 gap-4">
      {/* Total Contable Card */}
      <View className="flex-col items-center justify-center rounded-2xl border border-neutral-border bg-neutral-white p-6">
        <Text className="mb-2 text-5xl font-semibold text-neutral-foreground">
          {isLoading ? '...' : formattedAmount}
        </Text>
        <Text className="text-base font-medium text-neutral-muted">
          Total Gastos Contables
        </Text>
      </View>

      {/* Archivos and Contables Cards */}
      <View className="flex-row gap-3">
        {/* Archivos Card */}
        <View className="flex-1 rounded-2xl border border-neutral-border/50 bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-default/15">
              <IconFolder
                width={20}
                height={20}
                stroke={COLORS.primary.default}
              />
            </View>
            <View className="flex-col items-start">
              <Text className="text-2xl font-bold text-primary-default">
                {isLoading ? '...' : (totalReceipts ?? 0)}
              </Text>
              <Text className="text-sm font-medium text-primary-dark">
                Archivos
              </Text>
            </View>
          </View>
        </View>

        {/* Contables Card */}
        <View className="flex-1 rounded-2xl border border-neutral-border/50 bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-success-default/15">
              <IconTrendingUp
                width={20}
                height={20}
                stroke={COLORS.success.default}
              />
            </View>
            <View className="flex-col items-start">
              <Text className="text-2xl font-bold text-success-default">
                {isLoading ? '...' : (expenseReceipts ?? 0)}
              </Text>
              <Text className="text-sm font-medium text-success-dark">
                Contables
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
